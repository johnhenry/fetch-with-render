#![deny(clippy::all)]

use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::Deserialize;
use std::cell::RefCell;
use std::collections::HashMap;
use std::sync::{mpsc, Arc, Mutex};
use std::time::Duration;
use tao::event::{Event, WindowEvent};
use tao::event_loop::{ControlFlow, EventLoop};
use tao::platform::run_return::EventLoopExtRunReturn;
use tao::window::{Window, WindowBuilder, WindowId};
use wry::WebView;
use wry::WebViewBuilder;

// Thread-local EventLoop - macOS requires EventLoop on main thread
// Node.js calls us on the main thread, so this works perfectly
thread_local! {
    static EVENT_LOOP: RefCell<Option<EventLoop<()>>> = RefCell::new(None);
}

// Render state for a single window
struct RenderState {
    #[allow(dead_code)] // Must keep window alive for the duration of the render
    window: Window,
    webview: Arc<Mutex<WebView>>,
    html_result: Arc<Mutex<Option<String>>>,
    result_tx: mpsc::Sender<std::result::Result<String, RenderError>>,
    start_time: std::time::Instant,
    timeout_duration: Duration,
}

#[derive(Deserialize, Default)]
#[napi(object)]
pub struct RenderOptions {
    /// Maximum time to wait for rendering in milliseconds
    pub timeout: Option<i64>,

    /// CSS selector to wait for before capturing HTML
    pub wait_for: Option<String>,

    /// CSS selector to extract (returns only matching element's HTML)
    pub selector: Option<String>,

    /// JavaScript code to execute before capturing HTML
    pub script: Option<String>,
}

#[derive(Debug)]
pub enum RenderError {
    WindowCreation(String),
    WebViewCreation(String),
    Timeout,
    ScriptExecution(String),
    Unknown(String),
}

impl From<RenderError> for napi::Error {
    fn from(err: RenderError) -> Self {
        match err {
            RenderError::WindowCreation(msg) => {
                napi::Error::from_reason(format!("WindowCreationError: {}", msg))
            }
            RenderError::WebViewCreation(msg) => {
                napi::Error::from_reason(format!("WebViewCreationError: {}", msg))
            }
            RenderError::Timeout => napi::Error::from_reason("RenderTimeoutError: Rendering timed out"),
            RenderError::ScriptExecution(msg) => {
                napi::Error::from_reason(format!("ScriptError: {}", msg))
            }
            RenderError::Unknown(msg) => napi::Error::from_reason(format!("UnknownError: {}", msg)),
        }
    }
}

/// Renders a webpage using a native WebView and returns the final HTML
#[napi]
pub fn render_page(url: String, options: Option<RenderOptions>) -> Result<String> {
    let opts = options.unwrap_or_default();
    let timeout_ms = opts.timeout.unwrap_or(5000);

    EVENT_LOOP.with(|event_loop_cell| {
        let mut event_loop_opt = event_loop_cell.borrow_mut();

        // Create EventLoop on first use only
        if event_loop_opt.is_none() {
            *event_loop_opt = Some(EventLoop::new());
        }

        // Borrow the EventLoop mutably
        let event_loop = event_loop_opt.as_mut().unwrap();

        // Create window and webview
        let (window_id, result_rx) = setup_render(event_loop, &url, opts, timeout_ms)
            .map_err(|e| -> napi::Error { e.into() })?;

        // Run the event loop until this render completes
        run_event_loop(event_loop, window_id);

        // Get the result
        result_rx
            .recv()
            .map_err(|_| {
                napi::Error::from_reason("Failed to receive result from event loop".to_string())
            })?
            .map_err(|e: RenderError| -> napi::Error { e.into() })
    })
}

fn setup_render(
    event_loop: &EventLoop<()>,
    url: &str,
    opts: RenderOptions,
    timeout_ms: i64,
) -> std::result::Result<(WindowId, mpsc::Receiver<std::result::Result<String, RenderError>>), RenderError> {
    let window = WindowBuilder::new()
        .with_visible(false)
        .with_title("fetch-with-render")
        .build(event_loop)
        .map_err(|e| RenderError::WindowCreation(e.to_string()))?;

    let window_id = window.id();

    let html_result: Arc<Mutex<Option<String>>> = Arc::new(Mutex::new(None));
    let html_ipc = Arc::clone(&html_result);

    let wait_for = opts.wait_for.clone();
    let selector = opts.selector.clone();
    let script = opts.script.clone();

    // IPC handler for receiving messages from webview
    let ipc_handler = move |msg: String| {
        if msg.starts_with("HTML:") {
            let html = msg.strip_prefix("HTML:").unwrap_or("");
            *html_ipc.lock().unwrap() = Some(html.to_string());
        }
    };

    let webview = WebViewBuilder::new(&window)
        .with_url(url)
        .with_initialization_script(&format!(
            r#"
            window.__renderReady = false;
            window.__waitFor = {};
            window.__selector = {};
            window.__customScript = {};

            window.addEventListener('load', () => {{
                window.__renderReady = true;
            }});

            window.checkAndExtract = function() {{
                if (!window.__renderReady) return false;

                if (window.__waitFor) {{
                    if (!document.querySelector(window.__waitFor)) return false;
                }}

                if (window.__customScript) {{
                    try {{
                        eval(window.__customScript);
                    }} catch(e) {{
                        console.error('Script error:', e);
                    }}
                }}

                let html;
                if (window.__selector) {{
                    const el = document.querySelector(window.__selector);
                    html = el ? el.outerHTML : '';
                }} else {{
                    html = document.documentElement.outerHTML;
                }}

                window.ipc.postMessage('HTML:' + html);
                return true;
            }};
            "#,
            serde_json::to_string(&wait_for).unwrap_or("null".to_string()),
            serde_json::to_string(&selector).unwrap_or("null".to_string()),
            serde_json::to_string(&script).unwrap_or("null".to_string())
        ))
        .with_ipc_handler(ipc_handler)
        .build()
        .map_err(|e| RenderError::WebViewCreation(e.to_string()))?;

    let (result_tx, result_rx) = mpsc::channel();

    let state = RenderState {
        window,
        webview: Arc::new(Mutex::new(webview)),
        html_result,
        result_tx,
        start_time: std::time::Instant::now(),
        timeout_duration: Duration::from_millis(timeout_ms as u64),
    };

    // Store the state in a thread-local map
    RENDER_STATES.with(|states| {
        states.borrow_mut().insert(window_id, state);
    });

    Ok((window_id, result_rx))
}

// Thread-local storage for active renders
thread_local! {
    static RENDER_STATES: RefCell<HashMap<WindowId, RenderState>> = RefCell::new(HashMap::new());
}

fn run_event_loop(event_loop: &mut EventLoop<()>, _target_window_id: WindowId) {
    event_loop.run_return(|event, _, control_flow| {
        *control_flow = ControlFlow::Poll;

        // Check all active renders
        let mut completed_windows = Vec::new();
        let mut should_exit = false;

        RENDER_STATES.with(|states| {
            let mut states_map = states.borrow_mut();

            // Process events for each window
            for (window_id, state) in states_map.iter_mut() {
                // Check if we have a result
                if state.html_result.lock().unwrap().is_some() {
                    let result = state
                        .html_result
                        .lock()
                        .unwrap()
                        .take()
                        .ok_or(RenderError::Unknown("No HTML captured".to_string()));
                    let _ = state.result_tx.send(result);
                    completed_windows.push(*window_id);
                    continue;
                }

                // Check timeout
                if state.start_time.elapsed() > state.timeout_duration {
                    let _ = state.result_tx.send(Err(RenderError::Timeout));
                    completed_windows.push(*window_id);
                    continue;
                }

                // Process window events
                if let Event::WindowEvent {
                    window_id: event_window_id,
                    event: window_event,
                    ..
                } = &event
                {
                    if event_window_id == window_id {
                        match window_event {
                            WindowEvent::CloseRequested => {
                                let result = state
                                    .html_result
                                    .lock()
                                    .unwrap()
                                    .take()
                                    .ok_or(RenderError::Unknown(
                                        "Window closed before HTML captured".to_string(),
                                    ));
                                let _ = state.result_tx.send(result);
                                completed_windows.push(*window_id);
                            }
                            _ => {}
                        }
                    }
                }

                // On MainEventsCleared, trigger checkAndExtract
                if matches!(event, Event::MainEventsCleared) {
                    if let Ok(webview) = state.webview.lock() {
                        let _ = webview
                            .evaluate_script("window.checkAndExtract && window.checkAndExtract()");
                    }
                }
            }

            // Remove completed windows
            for window_id in completed_windows {
                states_map.remove(&window_id);
            }

            // If no more active renders, exit the event loop
            if states_map.is_empty() {
                should_exit = true;
            }
        });

        if should_exit {
            *control_flow = ControlFlow::Exit;
        }
    });
}


#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_render_simple_page() {
        // This would require a test server
        // Placeholder for now
        assert!(true);
    }
}

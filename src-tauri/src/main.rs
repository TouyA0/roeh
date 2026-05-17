// Prevents a console window from appearing on Windows in release builds.
// DO NOT remove this line.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    roeh_lib::run()
}

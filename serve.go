package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/exec"
	"runtime"
)

//go:embed dist
var distFS embed.FS

const port = 8765

func getOpenURL() string {
	return fmt.Sprintf("http://127.0.0.1:%d", port)
}

func main() {
	webRoot, err := fs.Sub(distFS, "dist")
	if err != nil {
		log.Fatalf("embedded dist not found: %v", err)
	}

	handler := http.FileServer(http.FS(webRoot))
	openURL := getOpenURL()

	http.Handle("/", handler)
	go func() {
		openBrowser(openURL)
	}()

	log.Printf("Serving at http://127.0.0.1:%d", port)
	log.Print("Press Ctrl+C to stop")
	if err := http.ListenAndServe(fmt.Sprintf("127.0.0.1:%d", port), nil); err != nil {
		log.Fatal(err)
	}
}

func openBrowser(url string) {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "linux":
		cmd = exec.Command("xdg-open", url)
	case "windows":
		cmd = exec.Command("cmd", "/c", "start", url)
	case "darwin":
		cmd = exec.Command("open", url)
	default:
		return
	}
	cmd.Stderr = os.Stderr
	_ = cmd.Start()
}

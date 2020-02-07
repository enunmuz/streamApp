if (!("pictureInPictureEnabled" in document)) {
        console.setStatus("The Picture-in-Picture API is not available.");
      } else if (!document.pictureInPictureEnabled) {
        console.setStatus("The Picture-in-Picture API is disabled.");
      }
  
      log = console.log;
  
      let pipWindow;
  
      showVideo.addEventListener("click", async function(event) {
        log("Toggling Picture-in-Picture...");
        showVideo.disabled = true;
        try {
          if (video !== document.pictureInPictureElement)
            await video.requestPictureInPicture();
          else await document.exitPictureInPicture();
        } catch (error) {
          log(`> Argh! ${error}`);
        } finally {
            showVideo.disabled = false;
        }
      });
      video.addEventListener("enterpictureinpicture", function(event) {
        log("> Video entered Picture-in-Picture");
  
        pipWindow = event.pictureInPictureWindow;
        log(`> Window size is ${pipWindow.width}x${pipWindow.height}`);
  
        pipWindow.addEventListener("resize", onPipWindowResize);
      });
  
      video.addEventListener("leavepictureinpicture", function(event) {
        log("> Video left Picture-in-Picture");
  
        pipWindow.removeEventListener("resize", onPipWindowResize);
      });
  
      function onPipWindowResize(event) {
        log(`> Window size changed to ${pipWindow.width}x${pipWindow.height}`);
      }
  
      if ("pictureInPictureEnabled" in document) {
        setPipButton();
        video.addEventListener("loadedmetadata", setPipButton);
        video.addEventListener("emptied", setPipButton);
      } else {
        showVideo.hidden = true;
      }
  
      function setPipButton() {
        showVideo.disabled =
          video.readyState === 1 ||
          !document.pictureInPictureEnabled ||
          video.disablePictureInPicture;
      }
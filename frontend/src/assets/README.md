# Black Myth Background Image

Please add your background image for the Black Myth theme in this directory with the filename `blackmyth-bg.jpg`.

## Image Requirements

1. Resolution: At least 1920x1080 pixels (HD) or higher
2. Format: JPG file format
3. Content: Preferably an image with good contrast to ensure text readability
4. File size: Optimize for web (compressed while maintaining quality)

## How to Add the Image

Simply place your desired background image in this directory and name it `blackmyth-bg.jpg`. The theme will automatically use this image as the background.

## Fixing the Current Errors

If you're seeing errors about not being able to find `/blackmyth-bg.jpg`:

1. Make sure you place the image in this directory (`frontend/src/assets/`)
2. Name the file exactly `blackmyth-bg.jpg` (case sensitive)
3. Restart the development server after adding the image

The paths in the CSS have been updated to look for the image in this location rather than at the root.

## Temporary Solution

Until you provide a custom image, you could:
1. Use the image from your message
2. Find a suitable free-to-use image online
3. Use a solid color or gradient as a placeholder (a dark gradient is set as fallback)

Even without the image file, the theme will work with the fallback dark background, but for the best experience, we recommend adding a proper background image. 
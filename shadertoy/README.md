# How To Add New ShaderToys

1. Download the Chrome Extension for ShaderToys https://chromewebstore.google.com/detail/shadertoy-unofficial-plug/ohicbclhdmkhoabobgppffepcopomhgl
2. Find a ShaderToy at https://www.shadertoy.com/
3. Click the "Export" button right below the shadertoy preview pane to download the raw JSON export of the shadertowy
4. beautify the JSON using an online JSON beautifier
5. copy & paste the _template folder and rename the copied folder & the _template.js file found within the copied folder (both the folder & js file should have the exact same name)
6. copy & paste the beautified JSON object into the JS file (replacing the commented line `//copy shader JSON here`)
7. If the shader toy requires any image inputs used in the various iChannels, copy the URL for the inputs from the JSON file (where the URL starts with `/media/`) and paste the URL into your web browser with the prefix `https://shadertoy.com`, then download the media file from your web browser into the `newtab/media` folder (into its respective sub-folder, typically the `a` folder).
> NOTE: you can look at the `abstract-plane` shadertoy as an example of how this works.

> WARNING!: Please do not include any sound input resources 
8. Open `index.html` and add your new shadertoy to the `shadertoys` array.
9. Navigate to your new tab window in your favorite web browser and click the **tilde** key to display a list of available shader toys, then find your newly added shader toy to preview it.
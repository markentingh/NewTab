var jsnShader = [
    {
        "ver": "0.1",
        "renderpass": [
          {
            "outputs": [],
            "inputs": [
              {
                "channel": 0,
                "type": "texture",
                "id": "4dXGzn",
                "filepath": "/media/a/0c7bf5fe9462d5bffbd11126e82908e39be3ce56220d900f633d58fb432e56f5.png",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "false",
                  "srgb": "false",
                  "internal": "byte"
                }
              },
              {
                "channel": 1,
                "type": "texture",
                "id": "4sfGRn",
                "filepath": "/media/a/fb918796edc3d2221218db0811e240e72e340350008338b0c07a52bd353666a6.jpg",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "false",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// rendering params\nconst float sphsize=.7; // planet size\nconst float dist=.27; // distance for glow and distortion\nconst float perturb=.3; // distortion amount of the flow around the planet\nconst float displacement=.015; // hot air effect\nconst float windspeed=.4; // speed of wind flow\nconst float steps=110.; // number of steps for the volumetric rendering\nconst float stepsize=.025; \nconst float brightness=.43;\nconst vec3 planetcolor=vec3(0.55,0.4,0.3);\nconst float fade=.005; //fade by distance\nconst float glow=3.5; // glow amount, mainly on hit side\n\n\n// fractal params\nconst int iterations=13; \nconst float fractparam=.7;\nconst vec3 offset=vec3(1.5,2.,-1.5);\n\n\nfloat wind(vec3 p) {\n\tfloat d=max(0.,dist-max(0.,length(p)-sphsize)/sphsize)/dist; // for distortion and glow area\n\tfloat x=max(0.2,p.x*2.); // to increase glow on left side\n\tp.y*=1.+max(0.,-p.x-sphsize*.25)*1.5; // left side distortion (cheesy)\n\tp-=d*normalize(p)*perturb; // spheric distortion of flow\n\tp+=vec3(iTime*windspeed,0.,0.); // flow movement\n\tp=abs(fract((p+offset)*.1)-.5); // tile folding \n\tfor (int i=0; i<iterations; i++) {  \n\t\tp=abs(p)/dot(p,p)-fractparam; // the magic formula for the hot flow\n\t}\n\treturn length(p)*(1.+d*glow*x)+d*glow*x; // return the result with glow applied\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n\t// get ray dir\t\n\tvec2 uv = fragCoord.xy / iResolution.xy-.5;\n\tvec3 dir=vec3(uv,1.);\n\tdir.x*=iResolution.x/iResolution.y;\n\tvec3 from=vec3(0.,0.,-2.+texture(iChannel0,uv*.5+iTime).x*stepsize); //from+dither\n\n\t// volumetric rendering\n\tfloat v=0., l=-0.0001, t=iTime*windspeed*.2;\n\tfor (float r=10.;r<steps;r++) {\n\t\tvec3 p=from+r*dir*stepsize;\n\t\tfloat tx=texture(iChannel0,uv*.2+vec2(t,0.)).x*displacement; // hot air effect\n\t\tif (length(p)-sphsize-tx>0.)\n\t\t// outside planet, accumulate values as ray goes, applying distance fading\n\t\t\tv+=min(50.,wind(p))*max(0.,1.-r*fade); \n\t\telse if (l<0.) \n\t\t//inside planet, get planet shading if not already \n\t\t//loop continues because of previous problems with breaks and not always optimizes much\n\t\t\tl=pow(max(.53,dot(normalize(p),normalize(vec3(-1.,.5,-0.3)))),4.)\n\t\t\t*(.5+texture(iChannel1,uv*vec2(2.,1.)*(1.+p.z*.5)+vec2(tx+t*.5,0.)).x*2.);\n\t\t}\n\tv/=steps; v*=brightness; // average values and apply bright factor\n\tvec3 col=vec3(v*1.25,v*v,v*v*v)+l*planetcolor; // set color\n\tcol*=1.-length(pow(abs(uv),vec2(5.)))*14.; // vignette (kind of)\n\tfragColor = vec4(col,1.0);\n}",
            "name": "Image",
            "description": "",
            "type": "image"
          }
        ],
        "flags": {
          "mFlagVR": false,
          "mFlagWebcam": false,
          "mFlagSoundInput": false,
          "mFlagSoundOutput": false,
          "mFlagKeyboard": false,
          "mFlagMultipass": false,
          "mFlagMusicStream": false
        },
        "info": {
          "id": "4lf3Rj",
          "date": "1379021959",
          "viewed": 16425,
          "name": "Hot Shower",
          "username": "Kali",
          "description": "Using a tile-folded version of the \"p=abs(p)/dot(p,p)-c\" fractal (ashamedly named by me \"kaliset\"),  to render a hot particle-like flow and then applying some distortions to make it look like this kind of \"planet\" object is being hit by it.",
          "likes": 381,
          "published": 1,
          "flags": 0,
          "usePreview": 1,
          "tags": [
            "planet"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);
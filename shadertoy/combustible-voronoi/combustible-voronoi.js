var jsnShader = [
    {
        "ver": "0.1",
        "renderpass": [
          {
            "outputs": [
              {
                "channel": 0,
                "id": "4dfGRr"
              }
            ],
            "inputs": [],
            "code": "/* \n\n    Combustible Voronoi Layers\n\t--------------------------\n\n    The effect itself is nothing new or exciting, just some moving 3D Voronoi layering. \n    However, the fire palette might prove useful to some.\n\n*/\n\n\n// This is my favorite fire palette. It's trimmed down for shader usage, and is based on an \n// article I read at Hugo Elias's site years ago. I'm sure most old people, like me, have \n// visited his site at one time or another:\n//\n// http://freespace.virgin.net/hugo.elias/models/m_ffire.htm\n//\nvec3 firePalette(float i){\n\n    float T = 1400. + 1300.*i; // Temperature range (in Kelvin).\n    vec3 L = vec3(7.4, 5.6, 4.4); // Red, green, blue wavelengths (in hundreds of nanometers).\n    L = pow(L,vec3(5)) * (exp(1.43876719683e5/(T*L)) - 1.);\n    return 1. - exp(-5e8/L); // Exposure level. Set to \"50.\" For \"70,\" change the \"5\" to a \"7,\" etc.\n}\n\n/*\nvec3 firePalette(float i){\n\n    float T = 1400. + 1300.*i; // Temperature range (in Kelvin).\n    // Hardcode red, green and blue wavelengths (in hundreds of nanometers).\n    vec3 L = (exp(vec3(19442.7999572, 25692.271372, 32699.2544734)/T) - 1.);\n    // Exposure level. Set to \"50\" For \"70,\" change the \".5\" to a \".7,\" etc.\n    return 1. - exp(-vec3(22532.6051122, 90788.296915, 303184.239775)*2.*.5/L); \n}\n*/\n\n// Hash function. This particular one probably doesn't disperse things quite as nicely as some \n// of the others around, but it's compact, and seems to work.\n//\nvec3 hash33(vec3 p){ \n    \n    float n = sin(dot(p, vec3(7, 157, 113)));    \n    return fract(vec3(2097152, 262144, 32768)*n); \n}\n\n// 3D Voronoi: Obviously, this is just a rehash of IQ's original.\n//\nfloat voronoi(vec3 p){\n\n\tvec3 b, r, g = floor(p);\n\tp = fract(p); // \"p -= g;\" works on some GPUs, but not all, for some annoying reason.\n\t\n\t// Maximum value: I think outliers could get as high as \"3,\" the squared diagonal length \n\t// of the unit cube, with the mid point being \"0.75.\" Is that right? Either way, for this \n\t// example, the maximum is set to one, which would cover a good part of the range, whilst \n\t// dispensing with the need to clamp the final result.\n\tfloat d = 1.; \n     \n    // I've unrolled one of the loops. GPU architecture is a mystery to me, but I'm aware \n    // they're not fond of nesting, branching, etc. My laptop GPU seems to hate everything, \n    // including multiple loops. If it were a person, we wouldn't hang out. \n\tfor(int j = -1; j <= 1; j++) {\n\t    for(int i = -1; i <= 1; i++) {\n    \t\t\n\t\t    b = vec3(i, j, -1);\n\t\t    r = b - p + hash33(g+b);\n\t\t    d = min(d, dot(r,r));\n    \t\t\n\t\t    b.z = 0.0;\n\t\t    r = b - p + hash33(g+b);\n\t\t    d = min(d, dot(r,r));\n    \t\t\n\t\t    b.z = 1.;\n\t\t    r = b - p + hash33(g+b);\n\t\t    d = min(d, dot(r,r));\n    \t\t\t\n\t    }\n\t}\n\t\n\treturn d; // Range: [0, 1]\n}\n\n// Standard fBm function with some time dialation to give a parallax \n// kind of effect. In other words, the position and time frequencies \n// are changed at different rates from layer to layer.\n//\nfloat noiseLayers(in vec3 p) {\n\n    // Normally, you'd just add a time vector to \"p,\" and be done with \n    // it. However, in this instance, time is added seperately so that \n    // its frequency can be changed at a different rate. \"p.z\" is thrown \n    // in there just to distort things a little more.\n    vec3 t = vec3(0., 0., p.z + iTime*1.5);\n\n    const int iter = 5; // Just five layers is enough.\n    float tot = 0., sum = 0., amp = 1.; // Total, sum, amplitude.\n\n    for (int i = 0; i < iter; i++) {\n        tot += voronoi(p + t) * amp; // Add the layer to the total.\n        p *= 2.; // Position multiplied by two.\n        t *= 1.5; // Time multiplied by less than two.\n        sum += amp; // Sum of amplitudes.\n        amp *= .5; // Decrease successive layer amplitude, as normal.\n    }\n    \n    return tot/sum; // Range: [0, 1].\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    // Screen coordinates.\n\tvec2 uv = (fragCoord - iResolution.xy*.5) / iResolution.y;\n\t\n\t// Shifting the central position around, just a little, to simulate a \n\t// moving camera, albeit a pretty lame one.\n\tuv += vec2(sin(iTime*.5)*.25, cos(iTime*.5)*.125);\n\t\n    // Constructing the unit ray. \n\tvec3 rd = normalize(vec3(uv.x, uv.y, 3.1415926535898/8.));\n\n    // Rotating the ray about the XY plane, to simulate a rolling camera.\n\tfloat cs = cos(iTime*.25), si = sin(iTime*.25);\n    // Apparently \"r *= rM\" can break in some older browsers.\n\trd.xy = rd.xy*mat2(cs, -si, si, cs); \n\t\n\t// Passing a unit ray multiple into the Voronoi layer function, which \n\t// is nothing more than an fBm setup with some time dialation.\n\tfloat c = noiseLayers(rd*2.);\n\t\n\t// Optional: Adding a bit of random noise for a subtle dust effect. \n\tc = max(c + dot(hash33(rd)*2. - 1., vec3(.015)), 0.);\n\n    // Coloring:\n    \n    // Nebula.\n    c *= sqrt(c)*1.5; // Contrast.\n    vec3 col = firePalette(c); // Palettization.\n    //col = mix(col, col.zyx*.1+ c*.9, clamp((1.+rd.x+rd.y)*0.45, 0., 1.)); // Color dispersion.\n    col = mix(col, col.zyx*.15 + c*.85, min(pow(dot(rd.xy, rd.xy)*1.2, 1.5), 1.)); // Color dispersion.\n    col = pow(col, vec3(1.25)); // Tweaking the contrast a little.\n    \n    // The fire palette on its own. Perhaps a little too much fire color.\n    //c = pow(c*1.33, 1.25);\n    //vec3 col =  firePalette(c);\n   \n    // Black and white, just to keep the art students happy. :)\n\t//c *= c*1.5;\n\t//vec3 col = vec3(c);\n\t\n\t// Rough gamma correction, and done.\n\tfragColor = vec4(sqrt(clamp(col, 0., 1.)), 1);\n}",
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
          "id": "4tlSzl",
          "date": "1439902848",
          "viewed": 17532,
          "name": "Combustible Voronoi",
          "username": "Shane",
          "description": "The effect itself is nothing new or exciting, just some moving 3D Voronoi layering. However, the fire palette might prove useful to some.",
          "likes": 252,
          "published": 3,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "voronoi",
            "fire"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);
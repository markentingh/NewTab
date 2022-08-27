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
            "code": "/*--------------------------------------------------------------------------------------\nLicense CC0 - http://creativecommons.org/publicdomain/zero/1.0/\nTo the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.\n----------------------------------------------------------------------------------------\n^ This means do ANYTHING YOU WANT with this code. Because we are programmers, not lawyers.\n-Otavio Good\n*/\n\n// various noise functions\nfloat Hash3d(vec3 uv)\n{\n    float f = uv.x + uv.y * 37.0 + uv.z * 521.0;\n    return fract(cos(f*3.333)*100003.9);\n}\nfloat mixP(float f0, float f1, float a)\n{\n    return mix(f0, f1, a*a*(3.0-2.0*a));\n}\nconst vec2 zeroOne = vec2(0.0, 1.0);\nfloat noise(vec3 uv)\n{\n    vec3 fr = fract(uv.xyz);\n    vec3 fl = floor(uv.xyz);\n    float h000 = Hash3d(fl);\n    float h100 = Hash3d(fl + zeroOne.yxx);\n    float h010 = Hash3d(fl + zeroOne.xyx);\n    float h110 = Hash3d(fl + zeroOne.yyx);\n    float h001 = Hash3d(fl + zeroOne.xxy);\n    float h101 = Hash3d(fl + zeroOne.yxy);\n    float h011 = Hash3d(fl + zeroOne.xyy);\n    float h111 = Hash3d(fl + zeroOne.yyy);\n    return mixP(\n        mixP(mixP(h000, h100, fr.x), mixP(h010, h110, fr.x), fr.y),\n        mixP(mixP(h001, h101, fr.x), mixP(h011, h111, fr.x), fr.y)\n        , fr.z);\n}\n\nfloat PI=3.14159265;\n#define saturate(a) clamp(a, 0.0, 1.0)\n// Weird for loop trick so compiler doesn't unroll loop\n// By making the zero a variable instead of a constant, the compiler can't unroll the loop and\n// that speeds up compile times by a lot.\n#define ZERO_TRICK max(0, -iFrame)\n\nfloat Density(vec3 p)\n{\n    float final = noise(p*0.06125);\n    float other = noise(p*0.06125 + 1234.567);\n    other -= 0.5;\n    final -= 0.5;\n    final = 0.1/(abs(final*final*other));\n    final += 0.5;\n    return final*0.0001;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n\t// ---------------- First, set up the camera rays for ray marching ----------------\n\tvec2 uv = fragCoord.xy/iResolution.xy * 2.0 - 1.0;\n\n\t// Camera up vector.\n\tvec3 camUp=vec3(0,1,0); // vuv\n\n\t// Camera lookat.\n\tvec3 camLookat=vec3(0,0.0,0);\t// vrp\n\n\tfloat mx=iMouse.x/iResolution.x*PI*2.0 + iTime * 0.01;\n\tfloat my=-iMouse.y/iResolution.y*10.0 + sin(iTime * 0.03)*0.2+0.2;//*PI/2.01;\n\tvec3 camPos=vec3(cos(my)*cos(mx),sin(my),cos(my)*sin(mx))*(200.2); \t// prp\n\n\t// Camera setup.\n\tvec3 camVec=normalize(camLookat - camPos);//vpn\n\tvec3 sideNorm=normalize(cross(camUp, camVec));\t// u\n\tvec3 upNorm=cross(camVec, sideNorm);//v\n\tvec3 worldFacing=(camPos + camVec);//vcv\n\tvec3 worldPix = worldFacing + uv.x * sideNorm * (iResolution.x/iResolution.y) + uv.y * upNorm;//scrCoord\n\tvec3 relVec = normalize(worldPix - camPos);//scp\n\n\t// --------------------------------------------------------------------------------\n\tfloat t = 0.0;\n\tfloat inc = 0.02;\n\tfloat maxDepth = 70.0;\n\tvec3 pos = vec3(0,0,0);\n    float density = 0.0;\n\t// ray marching time\n    for (int i = ZERO_TRICK; i < 37; i++)\t// This is the count of how many times the ray actually marches.\n    {\n        if ((t > maxDepth)) break;\n        pos = camPos + relVec * t;\n        float temp = Density(pos);\n\n        inc = 1.9 + temp*0.05;\t// add temp because this makes it look extra crazy!\n        density += temp * inc;\n        t += inc;\n    }\n\n\t// --------------------------------------------------------------------------------\n\t// Now that we have done our ray marching, let's put some color on this.\n\tvec3 finalColor = vec3(0.01,0.1,1.0)* density*0.2;\n\n\t// output the final color with sqrt for \"gamma correction\"\n\tfragColor = vec4(sqrt(clamp(finalColor, 0.0, 1.0)),1.0);\n}\n",
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
          "id": "4djXzz",
          "date": "1408603987",
          "viewed": 14224,
          "name": "Topologica",
          "username": "otaviogood",
          "description": "At some point I stopped understanding exactly what makes this work, but it just kept getting cooler. Mostly, it's stepping through a low frequency noise function that ramps up to a 1/x pulse. But then there are lots of tweaks on top of that.",
          "likes": 182,
          "published": 3,
          "flags": 0,
          "usePreview": 1,
          "tags": [
            "noise",
            "glow",
            "contour"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);
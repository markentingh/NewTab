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
            "code": "// Ether by nimitz 2014 (twitter: @stormoid)\n// https://www.shadertoy.com/view/MsjSW3\n// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License\n// Contact the author for other licensing options\n\n#define t iTime\nmat2 m(float a){float c=cos(a), s=sin(a);return mat2(c,-s,s,c);}\nfloat map(vec3 p){\n    p.xz*= m(t*0.4);p.xy*= m(t*0.3);\n    vec3 q = p*2.+t;\n    return length(p+vec3(sin(t*0.7)))*log(length(p)+1.) + sin(q.x+sin(q.z+sin(q.y)))*0.5 - 1.;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ){\t\n\tvec2 p = fragCoord.xy/iResolution.y - vec2(.9,.5);\n    vec3 cl = vec3(0.);\n    float d = 2.5;\n    for(int i=0; i<=5; i++)\t{\n\t\tvec3 p = vec3(0,0,5.) + normalize(vec3(p, -1.))*d;\n        float rz = map(p);\n\t\tfloat f =  clamp((rz - map(p+.1))*0.5, -.1, 1. );\n        vec3 l = vec3(0.1,0.3,.4) + vec3(5., 2.5, 3.)*f;\n        cl = cl*l + smoothstep(2.5, .0, rz)*.7*l;\n\t\td += min(rz, 1.);\n\t}\n    fragColor = vec4(cl, 1.);\n}",
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
          "id": "MsjSW3",
          "date": "1416778116",
          "viewed": 18603,
          "name": "Ether",
          "username": "nimitz",
          "description": "A wild distance field in its natural habitat.",
          "likes": 444,
          "published": 1,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "3d",
            "fast",
            "cheap",
            "short"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);
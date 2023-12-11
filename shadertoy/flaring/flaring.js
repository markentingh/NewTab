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
              }
            ],
            "code": "// Flaring by nimitz (twitter: @stormoid)\n// https://www.shadertoy.com/view/lsSGzy\n// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License\n// Contact the author for other licensing options\n\n//change this value (1 to 5) or tweak the settings yourself.\n//the gamma and spot brightness parameters can use negative values\n#define TYPE 4\n\n#if TYPE == 1\n\t#define brightness 1.\n\t#define ray_brightness 11.\n\t#define gamma 5.\n\t#define spot_brightness 4.\n\t#define ray_density 1.5\n\t#define curvature .1\n\t#define red   7.\n\t#define green 1.3\n\t#define blue  1.\n\t//1 -> ridged, 2 -> sinfbm, 3 -> pure fbm\n\t#define noisetype 2\n\t#define sin_freq 50. //for type 2\n#elif TYPE == 2\n\t#define brightness 1.5\n\t#define ray_brightness 10.\n\t#define gamma 8.\n\t#define spot_brightness 15.\n\t#define ray_density 3.5\n\t#define curvature 15.\n\t#define red   4.\n\t#define green 1.\n\t#define blue  .1\n\t#define noisetype 1\n\t#define sin_freq 13.\n#elif TYPE == 3\n\t#define brightness 1.5\n\t#define ray_brightness 20.\n\t#define gamma 4.\n\t#define spot_brightness .95\n\t#define ray_density 3.14\n\t#define curvature 17.\n\t#define red   2.9\n\t#define green .7\n\t#define blue  3.5\n\t#define noisetype 2\n\t#define sin_freq 15.\n#elif TYPE == 4\n\t#define brightness 3.\n\t#define ray_brightness 5.\n\t#define gamma 6.\n\t#define spot_brightness 1.5\n\t#define ray_density 6.\n\t#define curvature 90.\n\t#define red   1.8\n\t#define green 3.\n\t#define blue  .5\n\t#define noisetype 1\n\t#define sin_freq 6.\n\t#define YO_DAWG\n#elif TYPE == 5\n\t#define brightness 2.\n\t#define ray_brightness 5.\n\t#define gamma 5.\n\t#define spot_brightness 1.7\n\t#define ray_density 30.\n\t#define curvature 1.\n\t#define red   1.\n\t#define green 4.0\n\t#define blue  4.9\n\t#define noisetype 2\n\t#define sin_freq 5. //for type 2\n#endif\n\n\n//#define PROCEDURAL_NOISE\n//#define YO_DAWG\n\n\nfloat hash( float n ){return fract(sin(n)*43758.5453);}\n\nfloat noise( in vec2 x )\n{\n\t#ifdef PROCEDURAL_NOISE\n\tx *= 1.75;\n    vec2 p = floor(x);\n    vec2 f = fract(x);\n\n    f = f*f*(3.0-2.0*f);\n\n    float n = p.x + p.y*57.0;\n\n    float res = mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),\n                    mix( hash(n+ 57.0), hash(n+ 58.0),f.x),f.y);\n    return res;\n\t#else\n\treturn texture(iChannel0, x*.01).x;\n\t#endif\n}\n\nmat2 m2 = mat2( 0.80,  0.60, -0.60,  0.80 );\nfloat fbm( in vec2 p )\n{\t\n\tfloat z=2.;\n\tfloat rz = 0.;\n\tp *= 0.25;\n\tfor (float i= 1.;i < 6.;i++ )\n\t{\n\t\t#if noisetype == 1\n\t\trz+= abs((noise(p)-0.5)*2.)/z;\n\t\t#elif noisetype == 2\n\t\trz+= (sin(noise(p)*sin_freq)*0.5+0.5) /z;\n\t\t#else\n\t\trz+= noise(p)/z;\n\t\t#endif\n\t\tz = z*2.;\n\t\tp = p*2.*m2;\n\t}\n\treturn rz;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n\tfloat t = -iTime*0.03;\n\tvec2 uv = fragCoord.xy / iResolution.xy-0.5;\n\tuv.x *= iResolution.x/iResolution.y;\n\tuv*= curvature*.05+0.0001;\n\t\n\tfloat r  = sqrt(dot(uv,uv));\n\tfloat x = dot(normalize(uv), vec2(.5,0.))+t;\t\n\tfloat y = dot(normalize(uv), vec2(.0,.5))+t;\n\t\n\t#ifdef YO_DAWG\n\tx = fbm(vec2(y*ray_density*0.5,r+x*ray_density*.2));\n\ty = fbm(vec2(r+y*ray_density*0.1,x*ray_density*.5));\n\t#endif\n\t\n    float val;\n    val = fbm(vec2(r+y*ray_density,r+x*ray_density-y));\n\tval = smoothstep(gamma*.02-.1,ray_brightness+(gamma*0.02-.1)+.001,val);\n\tval = sqrt(val);\n\t\n\tvec3 col = val/vec3(red,green,blue);\n\tcol = clamp(1.-col,0.,1.);\n\tcol = mix(col,vec3(1.),spot_brightness-r/0.1/curvature*200./brightness);\n    col = clamp(col,0.,1.);\n    col = pow(col,vec3(1.7));\n\t\n\tfragColor = vec4(col,1.0);\n}",
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
          "id": "lsSGzy",
          "date": "1389974877",
          "viewed": 8831,
          "name": "Flaring",
          "username": "nimitz",
          "description": "Procedural flares with easy to tweak settings. Using ridged noise to get sharp noise patterns.",
          "likes": 185,
          "published": 1,
          "flags": 0,
          "usePreview": 1,
          "tags": [
            "procedural",
            "2d",
            "flare"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);
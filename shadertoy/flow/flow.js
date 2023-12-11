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
            "code": "// Noise animation - Flow\n// 2014 by nimitz (twitter: @stormoid)\n// https://www.shadertoy.com/view/MdlXRS\n// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License\n// Contact the author for other licensing options\n\n\n//Somewhat inspired by the concepts behind \"flow noise\"\n//every octave of noise is modulated separately\n//with displacement using a rotated vector field\n\n//normalization is used to created \"swirls\"\n//usually not a good idea, depending on the type of noise\n//you are going for.\n\n//Sinus ridged fbm is used for better effect.\n\n#define time iTime*0.1\n#define tau 6.2831853\n\nmat2 makem2(in float theta){float c = cos(theta);float s = sin(theta);return mat2(c,-s,s,c);}\nfloat noise( in vec2 x ){return texture(iChannel0, x*.01).x;}\nmat2 m2 = mat2( 0.80,  0.60, -0.60,  0.80 );\n\nfloat grid(vec2 p)\n{\n\tfloat s = sin(p.x)*cos(p.y);\n\treturn s;\n}\n\nfloat flow(in vec2 p)\n{\n\tfloat z=2.;\n\tfloat rz = 0.;\n\tvec2 bp = p;\n\tfor (float i= 1.;i < 7.;i++ )\n\t{\n\t\tbp += time*1.5;\n\t\tvec2 gr = vec2(grid(p*3.-time*2.),grid(p*3.+4.-time*2.))*0.4;\n\t\tgr = normalize(gr)*0.4;\n\t\tgr *= makem2((p.x+p.y)*.3+time*10.);\n\t\tp += gr*0.5;\n\t\t\n\t\trz+= (sin(noise(p)*8.)*0.5+0.5) /z;\n\t\t\n\t\tp = mix(bp,p,.5);\n\t\tz *= 1.7;\n\t\tp *= 2.5;\n\t\tp*=m2;\n\t\tbp *= 2.5;\n\t\tbp*=m2;\n\t}\n\treturn rz;\t\n}\n\nfloat spiral(vec2 p,float scl) \n{\n\tfloat r = length(p);\n\tr = log(r);\n\tfloat a = atan(p.y, p.x);\n\treturn abs(mod(scl*(r-2./scl*a),tau)-1.)*2.;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n\tvec2 p = fragCoord.xy / iResolution.xy-0.5;\n\tp.x *= iResolution.x/iResolution.y;\n\tp*= 3.;\n\tfloat rz = flow(p);\n\tp /= exp(mod(time*3.,2.1));\n\trz *= (6.-spiral(p,3.))*.9;\n\tvec3 col = vec3(.2,0.07,0.01)/rz;\n\tcol=pow(abs(col),vec3(1.01));\n\tfragColor = vec4(col,1.0);\n}",
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
          "id": "MdlXRS",
          "date": "1403494492",
          "viewed": 16836,
          "name": "Noise animation - Flow",
          "username": "nimitz",
          "description": "Playing with different ways of animating noise. In this version, the noise is made using a technique similar to \"flow noise\" (maybe it even qualifies as flow noise)",
          "likes": 275,
          "published": 1,
          "flags": 0,
          "usePreview": 1,
          "tags": [
            "procedural",
            "2d",
            "noise"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);
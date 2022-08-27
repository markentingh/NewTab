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
                "id": "Xsf3zn",
                "filepath": "/media/a/f735bee5b64ef98879dc618b016ecf7939a5756040c2cde21ccb15e69a6e1cfb.png",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "false",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "//Magnetismic by nimitz (twitter: @stormoid)\n// https://www.shadertoy.com/view/XlB3zV\n// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License\n// Contact the author for other licensing options\n\n//Getting 60fps here at high quality\n#define HIGH_QUALITY\n\n#ifdef HIGH_QUALITY\n#define STEPS 130\n#define ALPHA_WEIGHT 0.015\n#define BASE_STEP 0.025\n#else\n#define STEPS 50\n#define ALPHA_WEIGHT 0.05\n#define BASE_STEP 0.1\n#endif\n\n#define time iTime\nvec2 mo;\nvec2 rot(in vec2 p, in float a){float c = cos(a), s = sin(a);return p*mat2(c,s,-s,c);}\nfloat hash21(in vec2 n){ return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }\nfloat noise(in vec3 p)\n{\n\tvec3 ip = floor(p), fp = fract(p);\n    fp = fp*fp*(3.0-2.0*fp);\n\tvec2 tap = (ip.xy+vec2(37.0,17.0)*ip.z) + fp.xy;\n\tvec2 cl = textureLod( iChannel0, (tap + 0.5)/256.0, 0.0 ).yx;\n\treturn mix(cl.x, cl.y, fp.z);\n}\n\nfloat fbm(in vec3 p, in float sr)\n{\n    p *= 3.5;\n    float rz = 0., z = 1.;\n    for(int i=0;i<4;i++)\n    {\n        float n = noise(p-time*.6);\n        rz += (sin(n*4.4)-.45)*z;\n        z *= .47;\n        p *= 3.5;\n    }\n    return rz;\n}\n\nvec4 map(in vec3 p)\n{\n    float dtp = dot(p,p);\n\tp = .5*p/(dtp + .2);\n    p.xz = rot(p.xz, p.y*2.5);\n    p.xy = rot(p.xz, p.y*2.);\n    \n    float dtp2 = dot(p, p);\n    p = (mo.y + .6)*3.*p/(dtp2 - 5.);\n    float r = clamp(fbm(p, dtp*0.1)*1.5-dtp*(.35-sin(time*0.3)*0.15), 0. ,1.);\n    vec4 col = vec4(.5,1.7,.5,.96)*r;\n    \n    float grd = clamp((dtp+.7)*0.4,0.,1.);\n    col.b += grd*.6;\n    col.r -= grd*.5;    \n    vec3 lv = mix(p,vec3(0.3),2.);\n    grd = clamp((col.w - fbm(p+lv*.05,1.))*2., 0.01, 1.5 );\n    col.rgb *= vec3(.5, 0.4, .6)*grd + vec3(4.,0.,.4);\n    col.a *= clamp(dtp*2.-1.,0.,1.)*0.07+0.87;\n    \n    return col;\n}\n\nvec4 vmarch(in vec3 ro, in vec3 rd)\n{\n\tvec4 rz = vec4(0);\n\tfloat t = 2.5;\n    t += 0.03*hash21(gl_FragCoord.xy);\n\tfor(int i=0; i<STEPS; i++)\n\t{\n\t\tif(rz.a > 0.99 || t > 6.)break;\n\t\tvec3 pos = ro + t*rd;\n        vec4 col = map(pos);\n        float den = col.a;\n        col.a *= ALPHA_WEIGHT;\n\t\tcol.rgb *= col.a*1.7;\n\t\trz += col*(1. - rz.a);\n        t += BASE_STEP - den*(BASE_STEP-BASE_STEP*0.015);\n\t}\n    return rz;\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord)\n{\n\tvec2 p = fragCoord.xy/iResolution.xy*2. - 1.;\n\tp.x *= iResolution.x/iResolution.y*.85;\n    p *= 1.1;\n\tmo = 2.0*iMouse.xy/iResolution.xy;\n    mo = (mo==vec2(.0))?mo=vec2(0.5,1.):mo;\n\t\n\tvec3 ro = 4.*normalize(vec3(cos(2.75-2.0*(mo.x+time*0.05)), sin(time*0.22)*0.2, sin(2.75-2.0*(mo.x+time*0.05))));\n\tvec3 eye = normalize(vec3(0) - ro);\n\tvec3 rgt = normalize(cross(vec3(0,1,0), eye));\n\tvec3 up = cross(eye,rgt);\n\tvec3 rd = normalize(p.x*rgt + p.y*up + (3.3-sin(time*0.3)*.7)*eye);\n\t\n\tvec4 col = clamp(vmarch(ro, rd),0.,1.);\n    col.rgb = pow(col.rgb, vec3(.9));\n    /*col.rb = rot(col.rg, 0.35);\n    col.gb = rot(col.gb, -0.1);*/\n    \n    fragColor = vec4(col.rgb, 1.0);\n}",
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
          "id": "XlB3zV",
          "date": "1430516268",
          "viewed": 8284,
          "name": "Magnetismic",
          "username": "nimitz",
          "description": "Volumetric rendering of a deformed field.\n\nWipe Up/Down = frequency",
          "likes": 336,
          "published": 1,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "3d",
            "noise",
            "volumetric",
            "animated"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);
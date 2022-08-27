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
            "code": "// License: CC BY 4.0\n\n#define ANIMATE_CLOUDS 0\n\nconst float R0 = 6360e3;\nconst float Ra = 6380e3;\nconst int steps = 128;\nconst int stepss = 8;\nconst float g = .76;\nconst float g2 = g * g;\nconst float Hr = 8e3;\nconst float Hm = 1.2e3;\nconst float I = 10.;\n\n#define t iTime\n\nvec3 C = vec3(0., -R0, 0.);\nvec3 bM = vec3(21e-6);\nvec3 bR = vec3(5.8e-6, 13.5e-6, 33.1e-6);\nvec3 Ds = normalize(vec3(0., .09, -1.));\n\nfloat noise(in vec2 v) { return textureLod(iChannel0, (v+.5)/256., 0.).r; }\n\n// by iq\nfloat noise(in vec3 v) {\n\tvec3 p = floor(v);\n    vec3 f = fract(v);\n\t//f = f*f*(3.-2.*f);\n\t\n\tvec2 uv = (p.xy+vec2(37.,17.)*p.z) + f.xy;\n\tvec2 rg = textureLod( iChannel0, (uv+.5)/256., 0.).yx;\n\treturn mix(rg.x, rg.y, f.z);\n}\n\nfloat fnoise(in vec3 v) {\n#if ANIMATE_CLOUDS\n\treturn\n\t\t.55 * noise(v) +\n\t\t.225 * noise(v*2. + t *.4) +\n\t\t.125 * noise(v*3.99) +\n\t\t.0625 * noise(v*8.9);\n#else\n\treturn\n\t\t.55 * noise(v) +\n\t\t.225 * noise(v*2.) +\n\t\t.125 * noise(v*3.99) +\n\t\t.0625 * noise(v*8.9);\n#endif\n}\n\nfloat cloud(vec3 p) {\n\tfloat cld = fnoise(p*2e-4);\n\tcld = smoothstep(.4+.04, .6+.04, cld);\n\tcld *= cld * 40.;\n\treturn cld;\n}\n\nvoid densities(in vec3 pos, out float rayleigh, out float mie) {\n\tfloat h = length(pos - C) - R0;\n\trayleigh =  exp(-h/Hr);\n\n\tfloat cld = 0.;\n\tif (5e3 < h && h < 10e3) {\n\t\tcld = cloud(pos+vec3(23175.7, 0.,-t*3e3));\n\t\tcld *= sin(3.1415*(h-5e3)/5e3);\n\t}\n\tmie = exp(-h/Hm) + cld;\n}\n\nfloat escape(in vec3 p, in vec3 d, in float R) {\n\tvec3 v = p - C;\n\tfloat b = dot(v, d);\n\tfloat c = dot(v, v) - R*R;\n\tfloat det2 = b * b - c;\n\tif (det2 < 0.) return -1.;\n\tfloat det = sqrt(det2);\n\tfloat t1 = -b - det, t2 = -b + det;\n\treturn (t1 >= 0.) ? t1 : t2;\n}\n\n// this can be explained: http://www.scratchapixel.com/lessons/3d-advanced-lessons/simulating-the-colors-of-the-sky/atmospheric-scattering/\nvec3 scatter(vec3 o, vec3 d) {\n\tfloat L = escape(o, d, Ra);\t\n\tfloat mu = dot(d, Ds);\n\tfloat opmu2 = 1. + mu*mu;\n\tfloat phaseR = .0596831 * opmu2;\n\tfloat phaseM = .1193662 * (1. - g2) * opmu2 / ((2. + g2) * pow(1. + g2 - 2.*g*mu, 1.5));\n\t\n\tfloat depthR = 0., depthM = 0.;\n\tvec3 R = vec3(0.), M = vec3(0.);\n\t\n\tfloat dl = L / float(steps);\n\tfor (int i = 0; i < steps; ++i) {\n\t\tfloat l = float(i) * dl;\n\t\tvec3 p = o + d * l;\n\n\t\tfloat dR, dM;\n\t\tdensities(p, dR, dM);\n\t\tdR *= dl; dM *= dl;\n\t\tdepthR += dR;\n\t\tdepthM += dM;\n\n\t\tfloat Ls = escape(p, Ds, Ra);\n\t\tif (Ls > 0.) {\n\t\t\tfloat dls = Ls / float(stepss);\n\t\t\tfloat depthRs = 0., depthMs = 0.;\n\t\t\tfor (int j = 0; j < stepss; ++j) {\n\t\t\t\tfloat ls = float(j) * dls;\n\t\t\t\tvec3 ps = p + Ds * ls;\n\t\t\t\tfloat dRs, dMs;\n\t\t\t\tdensities(ps, dRs, dMs);\n\t\t\t\tdepthRs += dRs * dls;\n\t\t\t\tdepthMs += dMs * dls;\n\t\t\t}\n\t\t\t\n\t\t\tvec3 A = exp(-(bR * (depthRs + depthR) + bM * (depthMs + depthM)));\n\t\t\tR += A * dR;\n\t\t\tM += A * dM;\n\t\t} else {\n\t\t\treturn vec3(0.);\n\t\t}\n\t}\n\t\n\treturn I * (R * bR * phaseR + M * bM * phaseM);\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n\tif (iMouse.z > 0.) {\n\t\tfloat ph = 3.3 * (1. - iMouse.y / iResolution.y);\n\t\tDs = normalize(vec3(iMouse.x / iResolution.x - .5, sin(ph), cos(ph)));\n\t}\n\t\n\tvec2 uv = fragCoord.xy / iResolution.xy * 2. - 1.;\n\tuv.x *= iResolution.x / iResolution.y;\n\t\n\tvec3 O = vec3(uv * .1, 0.) + vec3(0., 25e2, 0.);\n\tvec3 D = normalize(vec3(uv, -2.));\n\t\n\tfloat att = 1.;\n\tif (D.y < -.02) {\n\t\tfloat L = - O.y / D.y;\n\t\tO = O + D * L;\n\t\t\n\t\tD.y = -D.y;\n\t\tD = normalize(D+vec3(0.,.003*sin(t+6.2831*noise(O.xz*.8+vec2(0.,-t*3e3))),0.));\n\t\tatt = .6;\n\t}\n\t\n\tvec3 color = att * scatter(O, D);\n\n\tfloat env = pow(1. - smoothstep(.5, iResolution.x / iResolution.y, length(uv*.8)), .3);\n\tfragColor = vec4(env * pow(color, vec3(.4)), 1.);\n}",
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
          "id": "ldS3Wm",
          "date": "1394219377",
          "viewed": 14032,
          "name": "doski canady",
          "username": "w23",
          "description": "I cannot describe my shader. Use mouse to move sun around.",
          "likes": 236,
          "published": 1,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "3d",
            "sunset",
            "clouds",
            "scattering"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);
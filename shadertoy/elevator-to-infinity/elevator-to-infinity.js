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
                "id": "4dXGRn",
                "filepath": "/media/a/10eb4fe0ac8a7dc348a2cc282ca5df1759ab8bf680117e4047728100969e7b43.jpg",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "/* Elevator to infinity by @kishimisu (2023)  -  https://www.shadertoy.com/view/mddfW8\n   This work is licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (https://creativecommons.org/licenses/by-nc-sa/4.0/deed.en)\n   *****************************************\n   \n     Move the camera with the mouse!\n      \n   Alternative audio versions:\n   \n   I couldn't decide which audio and camera movement was the best for this scene,\n   so I preferred to keep this shader simple and fork the other ideas I liked:\n    \n   - Audio-reactive lights:                    https://www.shadertoy.com/view/DddBWM\n   - Longer camera anim + dark ambient music:  https://www.shadertoy.com/view/csdBD7\n   - Speed increase synced with music buildup: https://www.shadertoy.com/view/dddBWM\n\n\n   This is my first successful attempt at raymarching infinite buildings.\n   In my previous attempts, I was adding details using domain repetition for\n   nearly all raymarching operators and it was too hard to maintain.\n   \n   In this version, I started with a simpler task, which is to generate only one\n   floor using regular raymarching, and then use domain repetition at the very \n   beginning to repeat the floor infinitely, thus creating infinite buildings.\n   \n   Do you have tips to reduce flickering in the distance ?\n*/\n\n// Comment out to disable all lights except elevators\n#define LIGHTS_ON\n\nfloat acc = 0.; // Neon light accumulation\nfloat occ = 1.; // Ambient occlusion (Fake)\n\n// 2D rotation\n#define rot(a) mat2(cos(a), -sin(a), sin(a), cos(a))\n\n// Domain rep.\n#define rep(p, r) mod(p+r, r+r)-r\n\n// Domain rep. ID\n#define rid(p, r) floor((p+r)/(r+r))\n\n// Finite domain rep.\n#define lrep(p, r, l) p-r*clamp(round(p/r), -l, l)\n\n// Fast random noise 2 -> 3\nvec3 hash(vec2 p) {\n    vec2 r = fract(sin(p*mat2(137.1, 12.7, 74.7, 269.5)) * 43478.5453);\n    return vec3(r, fract(r.x*r.y*1121.67));\n}\n// Random noise 3 -> 3 - https://shadertoyunofficial.wordpress.com/2019/01/02/\n#define hash33(p) fract(sin(p*mat3(127.1,311.7,74.7,269.5,183.3,246.1,113.5,271.9,124.6))*43758.5453123)\n\n// Distance functions - https://iquilezles.org/articles/distfunctions/\nfloat box(vec3 p, vec3 b) {\n    vec3 q = abs(p) - b;\n    return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.);\n}\nfloat rect(vec2 p, vec2 b) {\n    vec2 d = abs(p) - b;\n    return length(max(d, 0.)) + min(max(d.x, d.y), 0.);\n}\n\n#define ext 2.\nfloat opElevatorWindows(vec3 p, float b) {\n    float e  = box(p, vec3(ext*.8, 2.7, .3));\n    float lv = length(p.xz) - .1;   p.y += 1.;\n    float lh = length(p.yz) - .1;\n    lh = max(b, lh);\n    b  = max(b, -e);\n    b  = min(b, min(lv, lh));\n    return b;\n}\n\nfloat building(vec3 p0, vec3 p, float L) {\n    float B = rect(p.xz, vec2(L, 10)); // Main building   \n    float B2 = rect(vec2(abs(p.x)-L-ext, p.z), vec2(ext, 10)); // Elevator building\n    \n    // (Optim) Skip building calculations\n    if (min(B, B2) > .2) return min(B, B2);\n    \n    vec3 q = p;\n    float var = step(1., mod(rid(p.y, 3.), 6.)); // Railing variation\n    p.y = rep(p.y, 3.); // Infinite floor y-repetition\n    vec3 pb = vec3(abs(p.x), p.yz);\n\n#ifdef LIGHTS_ON\n    // Building lights\n    vec3  id = rid(vec3(q.xy, p0.z), vec3(21, 18, 48));\n    vec3  rn = hash33(id);\n    float rw = fract(rn.x*rn.z*1021.67);\n        \n    q.x += 14. * (rn.x*3.-1.);\n    q.y += 12. * (floor(rn.y*3.)-1.);\n    q.xy = rep(q.xy, vec2(21, 18));\n\n    float l = box(q, vec3(mix(3., 15., rw), rn.z*1.5+.5, 7));\n    acc += .5 / (1. + pow(abs(l)*20., 1.5)) \n                * smoothstep(0., .4, iTime - rw * 20.)\n                * step(p0.x, 10. + 2e2*step(20., abs(p0.z)));\n#endif\n    \n    // Occlusion\n    occ = min(occ, smoothstep(3.5, 0., -rect(p.xz, vec2(L+2.,10))));    \n    occ = min(occ, smoothstep(0.6, 0., -rect(pb.xz-vec2(L+ext,0), vec2(ext,10))));\n    \n    // Front hole\n    q = p;\n    q.x = rep(q.x, 7.);    \n    q.y -= (1. - var)*1.01;\n    \n    float f = box(q + vec3(0,0,10), vec3(6.6, 2. + var, 3));\n    B = max(B, -f);\n    B = max(B, -rect(q.xz + vec2(0,10), vec2(6.6, .7)*var));\n    \n    // Railing\n    q = p;\n    q.x = rep(q.x, .8);\n    \n    float r  = length(p.yz + vec2(1, 9.5-var*.5)) - .2;\n    float rv = length(q.xz + vec2(0, 9.5-var*.5)) - .16;\n    r = min(r, rv);\n    r = max(r, p.y + 1.);\n\n    // Back bars\n    q = p;\n    q.x = rep(q.x, 1.75);\n    \n    float b = length(q.xz + vec2(0, 7.3)) - .2;\n    r = min(r, b);\n    \n    B = min(B, r);\n    B = max(B, abs(p.x) - L);\n            \n    // (Optim) Skip elevator calculations\n    if (B2 > .04) return min(B, B2);\n    \n    // Elevator\n    B2 = opElevatorWindows(pb - vec3(L+ext,0,-9.9), B2);\n    B2 = opElevatorWindows(vec3(pb.z+8., pb.y, pb.x-L-ext-1.9), B2);\n\n    // Side windows\n    q = vec3(pb.xy, pb.z - 1.8);\n    q.z = lrep(q.z, 2.5, 2.);\n    \n    float w = box(q - vec3(L+ext*2.,1.2,0), vec3(.5, 1.6, 1.2));\n    B2 = max(B2, -w);\n                \n    return min(B, B2);\n}\n\nfloat map(vec3 p) {\n    vec2 id = vec2(step(40., p.x), rid(p.z, 140.));  \n    vec3 rn = mix(vec3(1, -.5, 0), hash(id), step(.5, id.x+id.y));\n        \n    // Buildings\n    vec3 p0 = p;\n    p.x = abs(abs(p.x - 40.) - 80.);\n    p.z = rep(p.z - id.x*200., 200.);\n    \n    float bL = 21.4 + id.y*3.;\n    float b1 = building(p0, p - vec3(30,0,0), bL);\n    float b2 = building(p0, vec3(p.z,p.y,-p.x), 185.);\n    \n    // Elevator lights\n    float rpy = 80. + 150. * rn.x;;\n    p.y = rep(p.y - iTime * 40. * (rn.y*.5+.5), rpy);\n    p -= vec3(30.+bL+ext, rn.z*rpy*.5, ext-10.);\n\n    float l = box(p, vec3(ext*.8, 2.7, ext*.8));\n    acc += .5 / (1. + pow(abs(l)*18., 1.17));\n    \n    // Fix broken distance before 20s\n    b2 = min(b2, abs(p0.x + p0.z - 30.) + 6.);\n\n    return min(b1, b2);\n}\n\n// https://iquilezles.org/articles/normalsSDF/\nvec3 normal(vec3 p) {\n    const vec2 k = vec2(1,-1)*.0001;\n    return normalize(k.xyy*map(p + k.xyy) + k.yyx*map(p + k.yyx) + \n                     k.yxy*map(p + k.yxy) + k.xxx*map(p + k.xxx));\n}\n\nvoid mainImage(out vec4 O, vec2 F) {\n    vec2  R = iResolution.xy,\n          u = (F+F-R)/R.y,\n          M = iMouse.xy/R * 2. - 1.;\n          M *= step(1., iMouse.z);\n    \n    // Camera animation\n    float T  = 1. - pow(1. - clamp(iTime*.025, 0., 1.), 3.);\n    float ax = mix(-.8, .36, T);\n    float az = mix(-40., -140., T);\n    float rx = M.x*.45 - (cos(iTime*.1)*.5+.5)*.4;\n    rx = clamp(ax + rx - .55, min(iTime*.05 - 1.6, -.9), .1);   \n\n    // Ray origin & direction\n    vec3 ro = vec3(0, iTime*10., az);\n    vec3 rd = normalize(vec3(u, 3));\n    \n    rd.zy *= rot(M.y*1.3); \n    rd.zx *= rot(rx); \n    ro.zx *= rot(rx);  \n   \n    // Raymarching\n    vec3 p; float d, t = 0.;\n    for (int i = 0; i < 60; i++) {\n        p = ro + t * rd; \n        t += d = map(p);\n        if (d < .01 || t > 2200.) break;\n    }\n    \n    // Base color\n    vec3 col = vec3(.13,.11,.26) - vec3(1,1,0)*abs(p.x-40.)*.001;\n    col *= clamp(1. + dot(normal(p), normalize(vec3(0,0,1))), .5, 1.);\n    \n    // Texture\n    col *= 1. - texture(iChannel0, vec2(p.x+p.z, p.y+p.z)*.05).rgb*.7;\n    \n    // Occlusion\n    col *= occ;\n    \n    // Exponential fog\n    col = mix(vec3(.002,.005,.015), col, exp(-t*.0025*vec3(.8,1,1.2) - length(u)*.5));\n\n    // Light accumulation\n    col += acc * mix(vec3(1,.97,.76), vec3(1,.57,.36), t*.0006);\n           \n    // Color correction\n    col = pow(col, .46*vec3(.98,.96,1));\n    \n    // Vignette\n    u = F/R; u *= 1. - u.yx;\n    col *= pow(clamp(u.x * u.y * 80., 0., 1.), .2);\n                   \n    O = vec4(col, 1);\n}",
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
          "id": "mddfW8",
          "date": "1697129855",
          "viewed": 938,
          "name": "Elevator to infinity",
          "username": "kishimisu",
          "description": "Inspired by [url]https://i.pinimg.com/564x/33/9b/e3/339be34164834d427922a36e75defece.jpg[/url]",
          "likes": 65,
          "published": 1,
          "flags": 0,
          "usePreview": 1,
          "tags": [
            "3d",
            "raymarching",
            "ray",
            "light",
            "marching",
            "space",
            "repetition",
            "tower",
            "night",
            "city",
            "city",
            "infinite",
            "neon",
            "buildings",
            "building",
            "liminal"
          ],
          "hasliked": 0,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);
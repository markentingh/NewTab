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
            "code": "// License: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License\n\nfloat hash(vec2 p) {\n    return fract(sin(dot(p, vec2(123.45, 875.43))) * 5432.3);\n}\n\n// Thanks Shane - https://www.shadertoy.com/view/lstGRB\nfloat noise(vec3 p) {\n\tconst vec3 s = vec3(7.0, 157.0, 113.0);\n\tvec3 ip = floor(p);\n    vec4 h = vec4(0.0, s.yz, s.y + s.z) + dot(ip, s);\n\tp -= ip;\n\t\n    h = mix(fract(sin(h) * 43758.5453), fract(sin(h + s.x) * 43758.5453), p.x);\n\t\n    h.xy = mix(h.xz, h.yw, p.y);\n    return mix(h.x, h.y, p.z);\n}\n\nfloat fbm(vec3 p) {\n    return (noise(p) + noise((p + 0.2) * 1.98) * 0.5 + noise((p + 0.66) * 4.12) * 0.25) / 1.75;\n}\n\nmat2 rot(float a) {\n    float c = cos(a);\n    float s = sin(a);\n    return mat2(c, s, -s, c);\n}\n\nfloat sdTorus(vec3 p, vec2 t) {\n  vec2 q = vec2(length(p.xz)-t.x,p.y);\n  return length(q)-t.y;\n}\n\nfloat sdCapsule(vec3 p, float h, float r) {\n  p.z -= clamp(p.z, 0.0, h);\n  return length(p) - r;\n}\n\nvec3 getRayDir(vec3 ro, vec3 lookAt, vec2 uv) {\n    vec3 forward = normalize(lookAt - ro);\n    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));\n    vec3 up = cross(forward, right);\n    return normalize(forward + right * uv.x + up * uv.y);\n}\n\nvec2 min2(vec2 a, vec2 b) {\n    return a.x < b.x ? a : b;\n}\n\nvec2 sdDonut(vec3 p) {\n    float d1 = sdTorus(p, vec2(4.0, 1.4));\n\treturn vec2(d1, 1.5);\n}\n\nvec2 sdCream(vec3 p) {\n    float f = 0.0;\n    f += sin(p.x * 1.1 + p.z * 1.2) * 1.1;\n    f += sin(p.x * 2.5) * 0.5;\n    f += sin(p.z * 4.0) * 0.25;\n    f /= 4.0;\n    \n    float d2 = abs(p.y + f + 2.0) - 2.3;\n    \n    float d1 = sdDonut(p).x;\n    float d = max(d1, -d2);\n    \n\treturn vec2(d - 0.13, 2.5);\n}\n\nvec2 sdSprinkles(vec3 p) {\n    float dd = sdCream(p - vec3(0.0, 0.05, 0.0)).x;\n    \n    vec3 id = floor(p / 0.3);\n    \n    p.xz *= rot(hash(id.xz) * 3.141);\n    p.xy *= rot(hash(id.xy) * 3.141);\n    p.xz *= rot(hash(id.xz) * 3.141);\n    \n    p.x = mod(p.x, 0.3) - 0.15;\n    p.y = mod(p.y, 0.3) - 0.15;\n    p.z = mod(p.z, 0.3) - 0.15;\n    \n    p.xz *= rot(hash(id.xz) * 3.141);\n    p.xy *= rot(hash(id.xy) * 3.141);\n    p.xz *= rot(hash(id.xz) * 3.141);\n    float d = sdCapsule(p, 0.3, 0.02);\n    \n    d = max(d, dd);\n    \n    return vec2(d, mod(id.x, 6.0) + mod(id.y, 6.0) + mod(id.z, 6.0) + 10.5);\n}\n\nvec2 map(vec3 p) {\n    float bumps = fbm(p * 8.0) * 0.02;\n    vec2 d1 = sdDonut(p) - bumps;\n    vec2 d2 = sdCream(p);\n    vec2 d3 = sdSprinkles(p);\n    vec2 d4 = vec2(p.y + 1.7, 3.5);\n    \n    return min2(d1, min2(d2, min2(d3, d4)));\n}\n\nvec3 calcNormal(in vec3 p) {\n    vec2 e = vec2(1.0, -1.0) * 0.0005;\n    return normalize(e.xyy * map(p + e.xyy).x + \n\t\t\t\t\t e.yyx * map(p + e.yyx).x + \n\t\t\t\t\t e.yxy * map(p + e.yxy).x + \n\t\t\t\t\t e.xxx * map(p + e.xxx).x);\n}\n\nfloat calcShadow(vec3 p, vec3 lightPos, float sharpness) {\n    vec3 rd = normalize(lightPos - p);\n    \n    float h;\n    float minH = 1.0;\n    float d = 0.7;\n    for (int i = 0; i < 16; i++) {\n        h = map(p + rd * d).x;\n        minH = abs(h / d);\n        if (minH < 0.01)\n            return 0.0;\n        d += h;\n    }\n    \n    return minH * sharpness;\n}\n\nfloat calcOcc(vec3 p, vec3 n, float strength) {\n    const float dist = 0.3;\n    return 1.0 - (dist - map(p + n * dist).x) * strength;\n}\n\n\n/**********************************************************************************/\n\n\nvec3 vignette(vec3 col, vec2 fragCoord) {\n    vec2 q = fragCoord.xy / iResolution.xy;\n    col *= 0.5 + 0.5 * pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.4);\n    return col;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n\n    vec3 col;\n\n    // Raymarch.\n    vec3 ro = vec3(sin(iTime * 0.3), 4.0 + cos(iTime * 0.6) * 0.5, -9.0);\n    vec3 rd = getRayDir(ro, vec3(0.0, -1.0, 0.0), uv);\n\n    int hit = 0;\n    float d = 0.01;\n    vec3 p;\n    for (float steps = 0.0; steps < 128.0; steps++) {\n        p = ro + rd * d;\n        vec2 h = map(p);\n\n        if (h.x < 0.001) {\n            hit = int(h.y);\n            break;\n        }\n\n        d += h.x;\n    }\n\n    if (hit > 0) {\n        vec3 n = calcNormal(p);\n        vec3 lightPos = vec3(10.0, 7.0, -10.0);\n        vec3 lightCol = vec3(1.0, 0.9, 0.8);\n        vec3 lightToPoint = normalize(lightPos - p);\n        vec3 skyCol = vec3(0.15, 0.2, 0.25);\n        float sha = calcShadow(p, lightPos, 5.0);\n        float occ = calcOcc(p, n, 4.0);\n        float spe = pow(max(0.0, dot(rd, reflect(lightToPoint, n))), 15.0);\n        float mainLight = max(0.0, dot(n, lightToPoint));\n        float backLight = clamp(dot(n, -rd), 0.01, 1.0) * 0.1;\n        vec3 skyLight = clamp(dot(n, vec3(0.0, 1.0, 0.0)), 0.01, 1.0) * 0.4 * skyCol;\n        float fog = 1.0 - exp(-d * 0.03);\n\n        vec3 mat;\n        if (hit == 1) {\n            // Donut.\n            mat = vec3(0.5, 0.3, 0.2);\n        } else if (hit == 2) {\n            // Cream.\n            mat = vec3(1.0, 0.43, 0.85);\n        } else if (hit == 3) {\n            // Plane.\n            mat = vec3(0.2);\n        } else if (hit >= 10) {\n            // Sprinkles!\n            vec3 c = vec3(float(hit)) + vec3(1.0, 2.0, 3.0);\n            mat = sin(floor(c * 3.0) / 3.0);\n        }\n\n        col = (mainLight * sha + (spe + backLight) * occ) * lightCol;\n        col += skyLight * occ;\n        col *= mat;\n        col = mix(col, skyCol, fog);\n    } else {\n        // Sky.\n        col = vec3(0.15, 0.2, 0.25);\n    }\n\n    // Output to screen\n    col = pow(col, vec3(0.4545)); // Gamma correction\n    col = vignette(col, fragCoord); // Fade screen corners\n    fragColor = vec4(col, 1.0);\n}",
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
          "id": "ttfyWB",
          "date": "1592936209",
          "viewed": 10307,
          "name": "Blender Donut",
          "username": "dean_the_coder",
          "description": "My take on the famous 'Blender donut'.\nCould do with finding a method to stop the ends of the sprinkles getting cut off...\nThanks to Evvvvil, Flopine, Nusan, BigWings, and a bunch of others for sharing their knowledge!",
          "likes": 19,
          "published": 3,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "3d",
            "raymarching",
            "donut",
            "blender",
            "cineshader"
          ],
          "hasliked": 0,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);
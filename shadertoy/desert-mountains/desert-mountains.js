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
            "code": "/**\n    Render complex mountain combined with sky light and mountain fog\n*/\n\n#define ROTATE_MATRIX mat2(0.6, -0.8, 0.8, 0.6)\n#define PIXEL_COORD_REDUCTION_FACTOR 0.003         \n#define MOUNTAIN_HEIGHT_AMPLIFICATION_FACTOR 120.0\n#define RAYMARCH_ITER_COUNT 256\n#define RAYMARCH_ITER_PRECISION 1e-4\n#define SOFTSHADOW_ITER_COUNT 80\n\n\n\nvec2 fix(in vec2 fragCoord) {\n    return (2.0 * fragCoord.xy - iResolution.xy) / min(iResolution.x, iResolution.y);\n}\n\nmat3 setCamera(vec3 lookAt, vec3 ro, float theta) {\n    vec3 z = normalize(lookAt - ro);\n    vec3 up = vec3(sin(theta), cos(theta), 0.0);\n    vec3 x = normalize(cross(z, up));\n    vec3 y = normalize(cross(x, z));\n    return mat3(x, y, z);\n}\n\nfloat random(in vec2 p) {\n    vec2 q = 55.1876653 * fract(p * 10.1321513);\n    return fract((q.x + q.y) * q.x * q.y);\n}\n\n// return noise value and noise gradient\nvec3 noise(in vec2 p) {\n    vec2 i = floor(p);\n    vec2 f = fract(p);\n    vec2 u = f * f * (3.0 - 2.0 * f);\n    vec2 du = 6.0 * f * (1.0 - f);\n\n    vec2 offset = vec2(1.0, 0.0);\n    float a = random(i);\n    float b = random(i + offset.xy);\n    float c = random(i + offset.yx);\n    float d = random(i + offset.xx);\n\n    float noiseV = a + (b - a) * u.x * (1.0 - u.y) + (c - a) * (1.0 - u.x) * u.y + (d - a) * u.x * u.y;\n    vec2 noiseG = du * (vec2(b - a, c - a) + (a - b - c + d) * u.yx);\n    return vec3(noiseV, noiseG);\n}\n\n// Low precision mountain sdf, use to determine the position of camera\nfloat sdfMountainLowPrecision(in vec2 p) {\n    vec2 q = PIXEL_COORD_REDUCTION_FACTOR * p;\n    float sdf = 0.0;\n    float scale = 1.0;\n    vec2 grad = vec2(0.0);\n    for (int i = 0; i < 4; i++) {\n        vec3 noiseInfo = noise(q);\n        grad += noiseInfo.yz;\n        sdf += scale * noiseInfo.x / (1.0 + dot(grad, grad));\n        q = ROTATE_MATRIX * q * 2.0;\n        scale *= 0.5;\n    }\n    return MOUNTAIN_HEIGHT_AMPLIFICATION_FACTOR * sdf;\n}\n\n// Mid precision mountain sdf, use to raymarch \nfloat sdfMountainMidPrecision(in vec2 p) {\n    vec2 q = PIXEL_COORD_REDUCTION_FACTOR * p;\n    float sdf = 0.0;\n    float scale = 1.0;\n    vec2 grad = vec2(0.0);\n    for (int i = 0; i < 8; i++) {\n        vec3 noiseInfo = noise(q);\n        grad += noiseInfo.yz;\n        sdf += scale * noiseInfo.x / (1.0 + dot(grad, grad));\n        q = ROTATE_MATRIX * q * 2.0;\n        scale *= 0.5;\n    }\n    return MOUNTAIN_HEIGHT_AMPLIFICATION_FACTOR * sdf;\n}\n\n// High precision mountain sdf, use to cal normal, enhance mountain detail\nfloat sdfMountainHighPrecision(in vec2 p) {\n    vec2 q = PIXEL_COORD_REDUCTION_FACTOR * p;\n    float sdf = 0.0;\n    float scale = 1.0;\n    vec2 grad = vec2(0.0);\n    for (int i = 0; i < 16; i++) {\n        vec3 noiseInfo = noise(q);\n        grad += noiseInfo.yz;\n        sdf += scale * noiseInfo.x / (1.0 + dot(grad, grad));\n        q = ROTATE_MATRIX * q * 2.0;\n        scale *= 0.5;\n    }\n    return MOUNTAIN_HEIGHT_AMPLIFICATION_FACTOR * sdf;\n}\n\nvec3 calNormal(vec3 p, float t) {\n    vec2 delta = vec2(1e-3 * t, 0.0);\n    float px = sdfMountainHighPrecision(p.xz - delta.xy) - sdfMountainHighPrecision(p.xz + delta.xy);\n    float py = 2.0 * delta.x;\n    float pz = sdfMountainHighPrecision(p.xz - delta.yx) - sdfMountainHighPrecision(p.xz + delta.yx);\n    return normalize(vec3(px, py, pz));\n}\n\nfloat rayMarch(vec3 ro, vec3 rd, float tmin, float tmax) {\n    float t = tmin;\n    for (int i = 0; i < RAYMARCH_ITER_COUNT; i++) {\n        vec3 p = ro + t * rd;\n        float h = p.y - sdfMountainMidPrecision(p.xz);\n        if (abs(h) < t * RAYMARCH_ITER_PRECISION || t > tmax) {\n            break;\n        }\n        t += 0.4 * h;\n    }   \n    return t;\n}\n\nfloat softShadow(vec3 ro, vec3 rd, float dis) {\n    float minStep = clamp(0.01 * dis, 0.5, 50.0);\n    float res = 1.0;\n    float t = 0.001;\n    for (int i = 0; i < SOFTSHADOW_ITER_COUNT; i++) {\n        vec3 p = ro + t * rd;\n        float h = p.y - sdfMountainMidPrecision(p.xz);\n        res = min(res, 8.0 * h / t);\n        t += max(minStep, h);\n        if (res < 0.001 || p.y > 200.0) {\n            break;\n        }\n    }\n    return clamp(res, 0.0, 1.0);\n}\n\nvec3 render(vec2 uv) {\n    vec3 col = vec3(0.0);\n\n    vec3 baseSkyCol = vec3(0.3, 0.5, 0.85);\n    vec3 baseGraySkyBandCol = vec3(0.7, 0.75, 0.85);\n    vec3 baseSunCol1 = vec3(1.0, 0.7, 0.4);\n    vec3 baseSunCol2 = vec3(1.0, 0.8, 0.6);\n    vec3 baseSunCol3 = vec3(1.0, 0.8, 0.7);\n    float sunCol1Weight = 0.25;\n    float sunCol2Weight = 0.25;\n    float sunCol3Weight = 0.2;\n    \n    vec3 baseMountainCol = vec3(0.67, 0.57, 0.44);\n    vec3 baseMountainFogCol = vec3(0.5, 0.75, 1.0);\n\n    vec3 softShadowAmplificationCof = vec3(8.0, 5.0, 3.0); \n    vec3 ambientColComponentCof = vec3(0.4, 0.6, 1.0);\n    vec3 backgroundCompoentCof = vec3(0.4, 0.5, 0.6);\n\n    float angle = 0.05 * iTime;\n    float r = 300.0;\n    float forward_offset = 0.01;\n    vec2 px2 = vec2(r * sin(angle), r * cos(angle));\n    float h = sdfMountainLowPrecision(px2) + 25.0;\n    vec3 lookAt = vec3(r * sin(angle + forward_offset), h, r * cos(angle + forward_offset));\n    vec3 ro = vec3(px2.x, h, px2.y);\n    float focus_distance = 1.0;\n    mat3 camera = setCamera(lookAt, ro, 0.0);\n    vec3 rd = normalize(camera * vec3(uv, focus_distance));\n\n    float tmin = 0.01;    // minimum iter distance of raymarch\n    float tmax = 1000.0;  // maximum iter distance of raymarch\n    float maxH = 300.0;   // maximum height of mountain\n    \n    // optimize: determine tmax and tmin by maximum height of mountain \n    float curMaxDistance = (maxH - ro.y) / rd.y; // distance of ro to highest mountain position\n    if (curMaxDistance > 0.0) {\n        if (maxH > ro.y) {\n            tmax = min(tmax, curMaxDistance);\n        } else {\n            tmin = max(tmin, curMaxDistance);\n        }\n    }\n    \n    vec3 sunDir = normalize(vec3(0.8, 0.5, -0.2));\n    float sunDot = clamp(dot(sunDir, rd), 0.0, 1.0);\n    float t = rayMarch(ro, rd, tmin, tmax);\n    \n    float difCof = 0.1;\n\n    // rendering\n    if (t < tmax) {\n        // rendering mountain\n        vec3 p = ro + t * rd;\n        vec3 n = calNormal(p, t);\n        vec3 difCol = difCof * baseMountainCol;\n        col = difCol; \n\n        vec3 linearColCof = vec3(0.0);\n        float difDot = clamp(dot(n, sunDir), 0.0, 1.0);\n        float softShadowCof = softShadow(p + 0.01 * sunDir, sunDir, t);\n        float softCofX = softShadowCof;\n        float softCofY = softShadowCof * softShadowCof * 0.5 + softShadowCof * 0.5;\n        float softCofZ = softShadowCof * softShadowCof * 0.8 + softShadowCof * 0.2;\n        float ambientCof = clamp(0.5 + 0.5 * n.y, 0.0, 1.0); // ambient occlusion cof\n        float backgroundCof = clamp(0.2 + 0.8 * dot(vec3(-sunDir.x, 0.0, sunDir.z), n), 0.0, 1.0);\n        linearColCof += difDot * softShadowAmplificationCof * vec3(softCofX, softCofY, softCofZ);\n        linearColCof += ambientCof * ambientColComponentCof * 5.0; \n        linearColCof += backgroundCof * backgroundCompoentCof;\n\n        col *= linearColCof;\n\n        // add fog effect to remote mountains: remote mountain means bigger t\n        col = mix(col, 0.75 * baseMountainFogCol, 1.0 - exp(-0.002 * t));\n    } else {\n        // rendering sky\n        col = baseSkyCol - rd.y * rd.y * rd.y * 0.3;\n        col = mix(col, 0.85 * baseGraySkyBandCol, pow(1.0 - max(rd.y, 0.0), 4.0));\n        col += sunCol1Weight * baseSunCol1 * pow(sunDot, 8.0);\n        col += sunCol2Weight * baseSunCol2 * pow(sunDot, 64.0);\n        col += sunCol3Weight * baseSunCol3 * pow(sunDot, 256.0);\n    }\n\n    col += 0.3 * vec3(1.0, 0.7, 0.3) * pow(sunDot, 8.0);\n\n    return col;\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fix(fragCoord);\n    vec3 col = render(uv);\n    fragColor = vec4(col, 1.0);\n}",
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
          "id": "mtccD4",
          "date": "1699203262",
          "viewed": 62,
          "name": "render sky mountain fog",
          "username": "tomcat7479",
          "description": "Render complex mountain combined with sky light and mountain fog",
          "likes": 3,
          "published": 1,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "noise",
            "mountainsdf"
          ],
          "hasliked": 0,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);
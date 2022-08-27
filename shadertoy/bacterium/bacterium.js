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
                "id": "XdfGRn",
                "filepath": "/media/a/e6e5631ce1237ae4c05b3563eda686400a401df4548d0f9fad40ecac1659c46c.jpg",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "false",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// Created by Vinicius Graciano Santos - vgs/2014\n// This shader needs some serious work on collision avoidance :D\n// http://viniciusgraciano.com/blog/making-of-bacterium/\n\n#define STEPS 64\n#define EPS 0.002\n#define FAR 18.0\n#define PI 3.14159265359\n\nfloat smin(float a, float b, float k) {\n    float h = clamp(.5+.5*(b-a)/k, 0.0, 1.0 );\n    return mix(b,a,h)-k*h*(1.-h);\n}\n\nvec2 rep(vec2 p) {\n    float a = atan(p.y, p.x);\n    a = mod(a, 2.0*PI/18.) - PI/18.;\n    return length(p)*vec2(cos(a), sin(a));\n}\n\nfloat spikedBall(vec3 p) {\n    p = mod(p, 8.0) - 4.0;\n    float d = length(p) - 1.2;\n    p.xz = rep(p.xz); p.xy = rep(p.xy); \n    return smin(d, length(p.yz)-.1+abs(.15*(p.x-1.0)), 0.1);\n}\n\nfloat capsules(vec3 p) {\n    vec3 q = floor(p/4.0);\n    p = mod(p, 4.0) - 2.0;\n    p.yz = p.yz*cos(iTime + q.z) + vec2(-p.z, p.y)*sin(iTime + q.z);\n    p.xy = p.xy*cos(iTime + q.x) + vec2(-p.y, p.x)*sin(iTime + q.x);\n    p.zx = p.zx*cos(iTime + q.y) + vec2(-p.x, p.z)*sin(iTime + q.y);\n    \n    float angle = .3*cos(iTime)*p.x;\n    p.xy = cos(angle)*p.xy + sin(angle)*vec2(-p.y, p.x); p.x += 1.0; \n    float k = clamp(2.0*p.x/4.0, 0.0, 1.0); p.x -= 2.*k;\n    return length(p) - .5;\n}\n\nfloat map(vec3 p) {   \n   return min(spikedBall(p), capsules(p));\n}\n\nvec3 normal(vec3 p) {\n    vec2 q = vec2(0.0, EPS);\n    return normalize(vec3(map(p + q.yxx) - map(p - q.yxx),\n                          map(p + q.xyx) - map(p - q.xyx),\n                          map(p + q.xxy) - map(p - q.xxy)));\n}\n\nfloat cubeMap(vec3 p, vec3 n) {\n    float a = texture(iChannel0, p.yz).r;\n    float b = texture(iChannel0, p.xz).r;\n    float c = texture(iChannel0, p.xy).r;\n    n = abs(n);\n    return (a*n.x + b*n.y + c*n.z)/(n.x+n.y+n.z);   \n}\n\nvec3 bumpMap(vec3 p, vec3 n, float c) {\n    vec2 q = vec2(0.0, .5);\n\tvec3 grad = -1.0*(vec3(cubeMap(p+q.yxx, n), cubeMap(p+q.xyx, n), cubeMap(p+q.xxy, n))-c)/q.y;\n    vec3 t = grad - n*dot(grad, n);\n    return normalize(n - t);\n}\n\nvec3 shade(vec3 ro, vec3 rd, float t) {\n    vec3 p = ro + t*rd, n = normal(p);\n   \n    vec3 green = pow(vec3(93,202,49)/255., vec3(2.2));\n    vec3 yellow = pow(vec3(255,204,0)/255., vec3(2.2));\n    \n    float k = cubeMap(.5*p, n);\n    n = bumpMap(.5*p, n, k);\n    \n    vec3 col = mix(green, yellow, k)*(1.0-dot(-rd,n));\n    if (spikedBall(p) < capsules(p)) {\n    \tp = mod(p, 8.0) - 4.0;\n        col *= 1.0/(1.0 + .5*dot(p, p));\n    }\n        \n    return col*exp(-.008*t*t);\n}\n\nmat3 lookat(vec3 p, vec3 t) {\n    vec3 z = normalize(p - t);\n    vec3 x = cross(z, vec3(0.0, 1.0, 0.0));\n    return mat3(x, cross(x, z), z);\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n\tvec2 uv = (-iResolution.xy + 2.0*fragCoord.xy) / iResolution.y;\n    uv *= 1.0 + .1*dot(uv,uv);\n    \n    vec3 ro = vec3(iTime, iTime, cos(iTime));\n    vec3 rd = normalize(lookat(ro, ro+vec3(cos(.1*iTime), sin(.1*iTime), 1.0))*vec3(uv, -1.0)); // direÃ§Ã£o do raio.\n    \n    // based on eiffie's antialiasing method (https://www.shadertoy.com/view/XsSXDt)\n    vec3 col = vec3(0.0);\n    vec4 stack = vec4(-1.0); bool grab = true;\n    float t = 0.0, d = EPS, od = d, pix = 4.0/iResolution.x, w = 1.8, s = 0.0;\n    for (int i = 0; i < STEPS; ++i) {\n        d = map(ro + t*rd);\n        if (w > 1.0 && (od + d < s)) {\n            s -= w*s; w = 1.0;\n        } else {\n            s = d * w;   \n        \tif (d <= od) grab = true;\n        \telse if (grab && stack.w < 0. && od < pix*(t-od)) {\n            \tstack.w = t-od; stack = stack.wxyz; \n            \tgrab = false;\n        \t}\n        \tif (d < EPS || t > FAR) break;\n        }\n        od = d; t += s; \n    }\n    col = d < EPS ? shade(ro, rd, t) : col;\n    \n    for (int i = 0; i < 4; ++i) {\n        if (stack[i] < 0.0) break;\n        d = map(ro + stack[i]*rd);\n        col = mix(shade(ro, rd, stack[i]), col, clamp(d/(pix*stack[i]), 0.0, 1.0));\n    }\n    \n    col = smoothstep(0., .7, col);\n    col = pow(col, vec3(1.0/2.2));\n    \n\tfragColor = vec4(col,1.0);\n}",
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
          "id": "MdBSDt",
          "date": "1417478282",
          "viewed": 7141,
          "name": "Bacterium",
          "username": "vgs",
          "description": "Bacterium, bacteria, bacterias...\nMy first try at anti-aliasing thanks to eiffie and his shader AA methods.",
          "likes": 169,
          "published": 1,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "raymarch",
            "antialiasing",
            "antialias",
            "bacteria"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);
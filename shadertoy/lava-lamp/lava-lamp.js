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
            "code": "const float SMOOTHNESS = 0.5;\nconst vec3 BLOB_COL_BASE = vec3(1.0, 0.11, 0.8);\nconst vec3 BLOB_COL_GLOW = vec3(1.0, 0.9, 0.0);\nconst float ROWS = 6.0;\n\nfloat smin(float a, float b, float k)\n{\n    float h = max(k-abs(a-b), 0.0)/k;\n    return min(a, b) - h*h*k*(1.0/4.0);\n}\n\nfloat rand(int i, float lo, float hi) {\n    return (hi - lo) * 0.5 * (sin(float(997*i)) + 1.) + lo;\n}\n\nvec4 perm(vec4 x) { x = ((x * 34.0) + 1.0) * x; return x - floor(x * (1.0 / 289.0)) * 289.0; }\n\nfloat noise(vec3 p)\n{\n    vec3 a = floor(p);\n    vec3 d = p - a;\n    d = d * d * (3.0 - 2.0 * d);\n\n    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);\n    vec4 k1 = perm(b.xyxy);\n    vec4 k2 = perm(k1.xyxy + b.zzww);\n\n    vec4 c = k2 + a.zzzz;\n    vec4 k3 = perm(c);\n    vec4 k4 = perm(c + 1.0);\n\n    vec4 o1 = fract(k3 * 0.02439024);\n    vec4 o2 = fract(k4 * 0.02439024);\n\n    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);\n    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);\n\n    return o4.y * d.y + o4.x * (1.0 - d.y);\n}\n\nfloat rand1d(float n) { return fract(sin(n) * 43758.5453123); }\n\nfloat noise1d(float p) \n{\n\tfloat fl = floor(p);\n\tfloat fc = fract(p);\n\treturn mix(rand1d(fl), rand1d(fl + 1.0), fc);\n}\n\nfloat blob(vec2 uv, vec2 pos, float n, float radius, float period, int index) \n{ \n    float time = iTime * 0.3 + float(index) * 684.7291;\n    int i = int(time / period);\n    float t = mod(time, period) / period;\n    \n    pos.y = smoothstep(0., .4, t)*2.-1.;\n    pos.y = mix(pos.y, -1., smoothstep(.5, .8, t)) * (ROWS - 1.0);\n    \n    //pos.x = pos.x - (noise1d(time * .25 + float(index) * 363.7543)*2.-1.) * ROWS;\n    \n    vec2 p = uv - pos + n;\n    return length(p) - radius;\n}\n\nfloat sdf(vec2 uv) \n{\n    float d = 9999999.;\n    float n = noise(vec3(uv, iTime * .2) * 0.7) * 0.7;\n    for (float i = -ROWS; i <= ROWS; i += 1.0) \n    {\n        float r = noise1d(i+iTime*0.2);\n        d = smin(d, blob(uv, vec2(i * iResolution.x / iResolution.y * 0.8, 0.0), n, (0.7 + r*2.) * 0.8, 8.0 + abs(rand1d(i)) * 8.0, int(i)), SMOOTHNESS);\n    }\n    return d;\n}\n\nfloat specular(vec3 light_dir, vec3 normal) {\n    light_dir = normalize(light_dir);\n    vec3 view_dir = vec3(0,0,-1);\n    vec3 halfway = normalize(light_dir + view_dir);\n    float s = max(0.0, dot(normal, halfway));\n    return s * s * s * s * s * s;\n}\n\nvec3 getNormal(vec2 uv) {\n    vec2 e = vec2(8.0, 0);\n    float nx = (sdf(uv - e.xy) - sdf(uv + e.xy)) / (2.0 * e.x);\n    float ny = (sdf(uv - e.yx) - sdf(uv + e.yx)) / (2.0 * e.x);\n    vec3 n = normalize(vec3(nx, ny, -1.));\n    return n;\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord)\n{\n    float min_res = min(iResolution.x, iResolution.y);\n    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / min_res * ROWS;\n    vec3 uvn = normalize(vec3(uv, 1.0));\n    \n    float d = sdf(uv); \n    vec3 n = getNormal(uv);\n    float m = smoothstep(0.0, 0.0 - fwidth(uv).y * 2., d);\n    float s = noise(vec3(uv, iTime * .5 + 630.737551) * 1.0) * 0.5;\n    float spec = max(0.0, uvn.y) * specular(vec3(uvn.x,-3.,0.0), n);\n    spec += min(1.0, 1.-uvn.y) * specular(vec3(uvn.x,3.,0.0), n);\n    spec = spec / (spec + 1.0) * 1.5;\n    vec3 col = spec * spec * (BLOB_COL_GLOW * 0.3 + 0.7) + mix(BLOB_COL_BASE, BLOB_COL_GLOW, spec);\n    col -= max(0.0, 1.- pow(abs(-d), 0.25)) * 0.7;\n    fragColor = vec4(col * m + BLOB_COL_BASE * (1.0 - m) / (6.0 + d), 1.0);\n}",
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
          "id": "dscBDn",
          "date": "1697103856",
          "viewed": 100,
          "name": "Fluid Lava Lamp",
          "username": "Peace",
          "description": "Fluid Lava Lamp",
          "likes": 2,
          "published": 3,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "fluid",
            "lava",
            "lamp"
          ],
          "hasliked": 0,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);
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
                "type": "buffer",
                "id": "4dXGR8",
                "filepath": "/media/previz/buffer00.png",
                "sampler": {
                  "filter": "linear",
                  "wrap": "clamp",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "void mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    // Output to screen\n    vec2 uv = fragCoord/iResolution.xy;\n    vec3 col = texture(iChannel0, uv).rgb;\n    col *= 0.5 + 0.5*pow( 16.0*uv.x*uv.y*(1.0-uv.x)*(1.0-uv.y), 0.2 );\n    fragColor = vec4(col, 1.0);\n}",
            "name": "Image",
            "description": "",
            "type": "image"
          },
          {
            "outputs": [
              {
                "channel": 0,
                "id": "4dXGR8"
              }
            ],
            "inputs": [
              {
                "channel": 0,
                "type": "texture",
                "id": "XsBSR3",
                "filepath": "/media/a/cb49c003b454385aa9975733aff4571c62182ccdda480aaba9a8d250014f00ec.png",
                "sampler": {
                  "filter": "linear",
                  "wrap": "repeat",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              },
              {
                "channel": 1,
                "type": "buffer",
                "id": "4dXGR8",
                "filepath": "/media/previz/buffer00.png",
                "sampler": {
                  "filter": "linear",
                  "wrap": "clamp",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "float noise(vec2 x){\n    vec2 f = fract(x);\n    vec2 u = f*f*f*(f*(f*6.0-15.0)+10.0);\n    vec2 du = 30.0*f*f*(f*(f-2.0)+1.0);\n    \n    vec2 p = floor(x);\n\tfloat a = texture(iChannel0, (p+vec2(0.0, 0.0))/1024.0).x;\n\tfloat b = texture(iChannel0, (p+vec2(1.0,0.0))/1024.0).x;\n\tfloat c = texture(iChannel0, (p+vec2(0.0,1.0))/1024.0).x;\n\tfloat d = texture(iChannel0, (p+vec2(1.0,1.0))/1024.0).x;\n\n    \n\treturn a+(b-a)*u.x+(c-a)*u.y+(a-b-c+d)*u.x*u.y;\n}\n\nfloat fbm(vec2 x, int detail){\n    float a = 0.0;\n    float b = 1.0;\n    float t = 0.0;\n    for(int i = 0; i < detail; i++){\n        float n = noise(x);\n        a += b*n;\n        t += b;\n        b *= 0.7;\n        x *= 2.0; \n    \n    }\n    return a/t;\n}\n\nfloat fbm2(vec2 x, int detail){\n    float a = 0.0;\n    float b = 1.0;\n    float t = 0.0;\n    for(int i = 0; i < detail; i++){\n        float n = noise(x);\n        a += b*n;\n        t += b;\n        b *= 0.9;\n        x *= 2.0; \n    \n    }\n    return a/t;\n}\n\nfloat box(vec2 uv, float x1, float x2, float y1, float y2){\n    return (uv.x > x1 && uv.x < x2 && uv.y > y1 && uv.y < y2)?1.0:0.0;\n} \n\n#define dot2(v) dot(v, v)\n#define layer(dh, v)  if (uv.y < h + midlevel - (dh) ) return vec4(v, 1.);\n\nvec4 foreground(vec2 uv, float t){\n    float midlevel;\n    float h;\n    float disp;\n    float dist;\n    vec2 uv2;\n    \n    uv.y -= 0.2;\n    // clouds foreground //////////////////////////////////////////////////////////////\n    \n    // c14\n    midlevel = -0.1;\n    disp = 1.7;\n    dist = 1.0;\n    uv2 = uv + vec2(t/dist + 40.0, 0.0);\n    h = (fbm(uv2, 8) - 0.5)*disp;\n    layer(0.12, vec3(0.43, 0.32, 0.31));\n    layer(0.08, vec3(0.55, 0.42, 0.41));\n    layer(0.04, vec3(0.66, 0.42, 0.40));\n    layer(0., vec3(0.77, 0.48, 0.46));\n    \n    // c13\n    \n    midlevel = 0.05;\n    disp = 1.7;\n    dist = 2.0;\n    uv2 = uv + vec2(t/dist + 38.0, 0.0);\n    h = (fbm(uv2, 8) - 0.5)*disp;\n    layer(0.1, vec3(0.95, 0.66, 0.48));\n    layer(0.04, vec3(0.98, 0.76, 0.64));\n    layer(0., vec3(0.95, 0.80, 0.77));\n    \n    return vec4(0.95, 0.80, 0.77, 0.);\n}\n\nvec4 background(vec2 uv, float t){\n    float midlevel;\n    float h;\n    float disp;\n    float dist;\n    vec2 uv2;\n    \n    // clouds ///////////////////////////////////////////////////////\n    \n    // c12\n    midlevel = 0.3;\n    disp = 0.9;\n    dist = 10.0;\n    uv2 = uv + vec2(t/dist + 32.5, 0.0);\n    h = (fbm(uv2, 8) - 0.5)*disp;\n    layer(0.14, vec3(0.48, 0.19, 0.20));\n    layer(0.1, vec3(0.68, 0.28, 0.19));\n    layer(0.07, vec3(0.88, 0.38, 0.24));\n    layer(0., vec3(0.95, 0.45, 0.30));\n    \n    // c11\n    midlevel = 0.35;\n    disp = 1.0;\n    dist = 15.0;\n    uv2 = uv + vec2(t/dist + 30.0, 0.0);\n    h = (fbm(uv2, 8) - 0.5)*disp;\n    layer(0.04, vec3(0.98, 0.76, 0.64));\n    layer(0., vec3(0.95, 0.80, 0.77));\n    \n    // c10\n    midlevel = 0.35;\n    disp = 3.5;\n    dist = 20.0;\n    uv2 = uv + vec2(t/dist + 27.5, 0.0);\n    h = (fbm(uv2, 8) - 0.5)*disp;\n    layer(0.12, vec3(0.43, 0.32, 0.31));\n    layer(0.08, vec3(0.55, 0.42, 0.41));\n    layer(0.04, vec3(0.66, 0.42, 0.40));\n    layer(0., vec3(0.77, 0.48, 0.46));\n    \n    // c9\n    midlevel = 0.45;\n    disp = 2.0;\n    dist = 25.0;\n    uv2 = uv + vec2(t/dist + 23.0, 0.0);\n    h = (fbm(uv2, 8) - 0.5)*disp;\n    layer(0.04, vec3(0.98, 0.57, 0.36));\n    layer(0., vec3(1.0, 0.62, 0.44));\n    \n    // c8\n    midlevel = 0.5;\n    disp = 2.3;\n    dist = 30.0;\n    uv2 = uv + vec2(t/dist + 20.5, 0.0);\n    h = (fbm(uv2, 8) - 0.5)*disp;\n    layer(0.12, vec3(0.41, 0.27, 0.27));\n    layer(0.08, vec3(0.53, 0.35, 0.32));\n    layer(0.04, vec3(0.80, 0.24, 0.17));\n    layer(0., vec3(0.99, 0.29, 0.20));\n    \n    // c7\n    midlevel = 0.5;\n    disp = 2.5;\n    dist = 35.0;\n    uv2 = uv + vec2(t/dist + 18.0, 0.0);\n    h = (fbm(uv2, 8) - 0.5)*disp;\n    layer(0.1, vec3(0.88, 0.38, 0.24));\n    layer(0.05, vec3(0.98, 0.42, 0.28));\n    layer(0., vec3(1.0, 0.48, 0.35));\n    \n    // c6\n    midlevel = 0.6;\n    disp = 2.0;\n    dist = 40.0;\n    uv2 = uv + vec2(t/dist + 18.0, 0.0);\n    h = (fbm(uv2, 8) - 0.5)*disp;\n    layer(0.1, vec3(0.95, 0.66, 0.48));\n    layer(0., vec3(1.0, 0.76, 0.60));\n    \n    // c5\n    midlevel = 0.75;\n    disp = 3.5;\n    dist = 45.0;\n    uv2 = uv + vec2(t/dist + 15.5, 0.0);\n    h = (fbm(uv2, 8) - 0.5)*disp;\n    layer(0.2, vec3(1.0, 0.55, 0.33));\n    layer(0.15, vec3(0.98, 0.50, 0.24));\n    layer(0.1, vec3(0.90, 0.55, 0.40));\n    layer(0., vec3(1.0, 0.62, 0.44));\n    \n    // c4\n    midlevel = 0.7;\n    disp = 2.7;\n    dist = 50.0;\n    uv2 = uv + vec2(t/dist + 12.0, 0.0);\n    h = (fbm(uv2, 8) - 0.5)*disp;\n    layer(0.04, vec3(0.73, 0.36, 0.30));\n    layer(0., vec3(0.80, 0.40, 0.34));\n    \n    // c3\n    midlevel = 0.8;\n    disp = 2.7;\n    dist = 60.0;\n    uv2 = uv + vec2(t/dist + 9.5, 0.0);\n    h = (fbm(uv2, 8) - 0.5)*disp;\n    layer(0.1, vec3(0.93, 0.58, 0.35));\n    layer(0., vec3(1.0, 0.76, 0.60));\n    \n    // c2\n    midlevel = 0.9;\n    disp = 3.0;\n    dist = 70.0;\n    uv2 = uv + vec2(t/dist + 7.0, 0.0);\n    h = (fbm(uv2, 8) - 0.5)*disp;\n    layer(0.1, vec3(0.56, 0.25, 0.22));\n    layer(0.05, vec3(0.60, 0.30, 0.27));\n    layer(0., vec3(0.74, 0.35, 0.30));\n    \n    // c1\n    midlevel = 1.0;\n    disp = 5.0;\n    dist = 100.0;\n    uv2 = uv + vec2(t/dist + 3.5, 0.0);\n    h = (fbm(uv2, 8) - 0.5)*disp;\n    layer(0.1, vec3(0.92, 0.85, 0.82));\n    layer(0., vec3(1.0, 0.94, 0.91));\n    \n    return vec4(0.58, 0.7, 1.0, 1.);\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 uv = fragCoord/iResolution.y;\n    //uv.x += iTime;\n    float t = iTime*4.0;\n    vec4 bg = background(uv, t);\n    \n    vec4 fg = vec4(0.);\n    int n = 5;\n    if (uv.y < 0.5)\n    for (int i = 0; i < n; i++){\n        fg += foreground(uv, t+4.*float(i)/float(n)/60.) / (float(n));\n    }\n    \n    vec3 col = bg.rgb;\n    // train /////////////////////////////////////////////////////////////////////\n    float k;\n    float midlevel;\n    float h;\n    float disp;\n    float dist;\n    vec2 uv2;\n    uv.y -= 0.2;\n    // choo choo\n    k = 1.0;\n    uv2 = fract(uv*9.0);\n    float wagon = 1.0;\n    wagon *= 1.0 - step(0.45, uv.x);\n    wagon *= 1.0 - step(0.115, uv.y);\n    wagon *= step(0.103, uv.y);\n    wagon *= step(0.05, 1.0 - abs(uv2.x*2.0 - 1.0));\n    \n    float join = 1.0; \n    join *= 1.0 - step(0.45, uv.x);\n    join *= 1.0 - step(0.11, uv.y);\n    join *= step(0.107, uv.y);\n    \n    \n    float roof = 1.0;\n    roof *= 1.0 - step(0.45, uv.x);\n    roof *= 1.0 - step(0.117, uv.y);\n    roof *= step(0.11, uv.y);\n    roof *= step(0.15, 1.0 - abs(uv2.x*2.0 - 1.0));\n    \n    float loco = box(uv, 0.45, 0.5, 0.103, 0.112);\n    float chem1 = box(uv, 0.49, 0.495, 0.103, 0.12);\n    float chem2 = box(uv, 0.488, 0.496, 0.12, 0.123);\n    float locoRoof = box(uv, 0.443, 0.47, 0.11, 0.117);\n    \n    float wheel = 1.0 - step(0.00004, dot2(uv - vec2(0.457, 0.106)));\n    wheel += 1.0 - step(0.00002, dot2(uv - vec2(0.487, 0.105)));\n    wheel += 1.0 - step(0.00002, dot2(uv - vec2(0.497, 0.105)));\n    \n    if (uv.x < 0.45 && uv.y > 0.025 && uv.y < 0.2){\n        wheel += 1.0 - step(0.002, dot2(uv2 - vec2(0.2, 0.95)));\n        wheel += 1.0 - step(0.002, dot2(uv2 - vec2(0.8, 0.95)));\n    }\n    col = mix(col, vec3(0.18, 0.12, 0.15), join);\n    col =  mix(col, vec3(0.48, 0.19, 0.20), wagon);\n    col = mix(col, vec3(0.18, 0.12, 0.15), roof);\n    \n    col = mix(col, vec3(0.38, 0.19, 0.20), loco);\n    col = mix(col, vec3(0.38, 0.19, 0.20), chem1);\n    col = mix(col, vec3(0.18, 0.12, 0.15), locoRoof);\n    col = mix(col, vec3(0.18, 0.12, 0.15), chem2 + wheel);\n    // loco smoke //////\n    \n    dist = 5.0;\n    uv2 = uv + vec2(t/dist + 3.5, 0.0);\n    uv2.x -= t/dist*0.2;\n    h = fbm2(uv2, 8) - 0.55;\n    \n    if(uv.x < 0.49){\n        float x = -uv.x + 0.49;\n        float y = abs(uv.y + h*0.4 - 0.16*sqrt(x) - 0.12) - 0.8*x*exp(-x*10.0);\n        if(y < 0.0) col = vec3(1.0, 0.94, 0.91);\n        if(y < - 0.02) col = vec3(0.92, 0.85, 0.82);\n    }\n    \n    //bridge ///////\n    dist = 5.0;\n    uv2 = uv + vec2(t/dist + 32.5, 0.0);\n    uv2.x = fract(uv2.x*3.0);\n    k = 1.0;\n    k *= smoothstep(0.001, 0.003, abs(uv2.y - pow(uv2.x - 0.5, 2.0)*0.15 - 0.12));\n    k *= min(step(0.05, 1.0 - abs(uv2.x*2.0 - 1.0))\n         +   step(0.17, uv2.y), 1.0);\n    k *= min(smoothstep(0.02, 0.05, 1.0 - abs(uv2.x*2.0 - 1.0))\n         +   step(0.177, uv2.y), 1.0);\n         \n    k *= min(step(0.1, uv2.y)\n           + smoothstep(-0.09, -0.085, -uv2.y - 0.001/(1.0 - abs(uv2.x*2.0 - 1.0))), 1.0);\n           \n    k *= min(smoothstep(0.05, 0.2, 1.0 - abs(fract(uv2.x*16.0)*2.0 - 1.0))\n         +   step(0.12, uv2.y - pow(uv2.x - 0.5, 2.0)*0.15)\n         +   step(-0.1, -uv2.y), 1.0);\n    col = mix(vec3(0.29, 0.09, 0.08)*smoothstep(-0.08, 0.08, uv.y), col, k);\n    \n    \n    \n    col = mix(col, fg.rgb, fg.a);\n\n    // Output to screen\n    uv = fragCoord/iResolution.xy;\n    col = mix(col, texture(iChannel1, uv).rgb, 0.3);\n    fragColor = vec4(col,1.0);\n}",
            "name": "Buffer A",
            "description": "",
            "type": "buffer"
          }
        ],
        "flags": {
          "mFlagVR": false,
          "mFlagWebcam": false,
          "mFlagSoundInput": false,
          "mFlagSoundOutput": false,
          "mFlagKeyboard": false,
          "mFlagMultipass": true,
          "mFlagMusicStream": false
        },
        "info": {
          "id": "Ndc3zl",
          "date": "1630447622",
          "viewed": 9233,
          "name": "up in the cloud sea",
          "username": "mdb",
          "description": "test of rendering different layers with parallax",
          "likes": 402,
          "published": 3,
          "flags": 32,
          "usePreview": 1,
          "tags": [
            "cloud",
            "parallax",
            "art",
            "train",
            "colorpalette",
            "stylised"
          ],
          "hasliked": 0,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);
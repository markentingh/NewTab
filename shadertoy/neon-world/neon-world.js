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
                "id": "XsXGR8",
                "filepath": "/media/previz/buffer01.png",
                "sampler": {
                  "filter": "linear",
                  "wrap": "clamp",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              },
              {
                "channel": 1,
                "type": "texture",
                "id": "Xsf3zn",
                "filepath": "/media/a/f735bee5b64ef98879dc618b016ecf7939a5756040c2cde21ccb15e69a6e1cfb.png",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "void mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n\tvec2 uv = fragCoord.xy/iResolution.xy;\n        \n    float b = step(fract(uv.y * 50.0 + iTime), 0.5);\n\tvec4 tex = texture(iChannel0, uv);\n    vec4 tex2 = texture(iChannel0, uv + vec2((b - 0.5)*0.005, 0.0));\n    \n    vec2 vign = smoothstep(vec2(0.5, 1.5), vec2(1.0, 0.98 + b*0.02), vec2(length(uv - 0.5) * 2.0)); \n       \n    vec4 grain = texture(iChannel1, fragCoord.xy/256.0 + vec2(0.0, iTime*10.0));\n    vec4 res = mix(tex, vec4(tex.x, tex.y, tex2.z, tex.w), vign.x);\n    vec4 col = res * vign.y * (0.85 + grain*0.15);\n\tfragColor = pow(col*1.75, vec4(1.25));\n}",
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
            "inputs": [],
            "code": "const float epsilon = 0.02;\nconst float pi = 3.14159265359;\nconst float speed = 3.0;\nconst vec3 wallsColor = vec3(0.05, 0.025, 0.025);\nconst vec3 lightColor = vec3(0.3, 0.6, 1.0);\nconst vec3 lightColor2 = vec3(0.5, 0.35, 0.35);\nconst vec3 fogColor = vec3(0.05, 0.05, 0.2);\nconst float curvAmout = 0.075;\nconst float reflAmout = 0.8;\n\n//Distance Field functions by iq :\n//https://iquilezles.org/articles/distfunctions\nfloat sdCylinder( vec3 p, vec3 c )\n{\n  return length(c.xy - p.xz) - c.z;\n}\n\nfloat sdCappedCylinder( vec3 p, vec2 h )\n{\n  vec2 d = abs(vec2(length(p.xz),p.y)) - h;\n  return min(max(d.x,d.y),0.0) + length(max(d,0.0));\n}\n\nfloat sdSphere( vec3 p, float s )\n{\n  return length(p)-s;\n}\n\nfloat sdBox( vec3 p, vec3 b )\n{\n  vec3 d = abs(p) - b;\n  return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));\n}\n\nvec3 opRep( vec3 p, vec3 c )\n{\n    return mod(p,c)-0.5*c;\n}\n\nvec2 linearStep2(vec2 mi, vec2 ma, vec2 v)\n{\n    return clamp((v - mi) / (ma - mi), 0.0 ,1.0);\n}\n\nfloat tunnel( vec3 p, vec3 c )\n{\n  return -length(c.xy - p.xz) + c.z;\n}\n\nvec4 distfunc(vec3 pos)\n{\n    vec3 repPos = opRep(pos, vec3(4.0, 1.0, 4.0));\n    vec2 sinPos = sin((pos.z * pi / 8.0) + vec2(0.0, pi)) * 1.75;\n    vec3 repPosSin = opRep(pos.xxz + vec3(sinPos.x, sinPos.y, 0.0), vec3(4.0, 4.0, 0.0));\n    \n    float cylinders = sdCylinder(vec3(repPos.x, pos.y, repPos.z), vec3(0.0, 0.0, 0.5));\n    float s = sin(iTime*3.0 + floor(pos.z*0.25));\n    float cutCylinders1 = sdBox(vec3(pos.x, pos.y, repPos.z), vec3(100.0, clamp(s, 0.025, 0.75), 1.0));\n    float cutCylinders2 = sdBox(vec3(repPos.x, pos.y, repPos.z), vec3(0.035, 100.0, 10.0));\n    float cuttedCylinders = max(-cutCylinders2, max(-cutCylinders1, cylinders));\n    \n    float innerCylinders = sdCylinder(vec3(repPos.x, pos.y, repPos.z), vec3(0.0, 0.0, 0.15));\n    float tubes1 = sdCylinder(vec3(repPosSin.x, 0.0, pos.y - 0.85), vec3(0.0, 0.0, 0.025));\n    float tubes2 = sdCylinder(vec3(repPosSin.y, 0.0, pos.y + 0.85), vec3(0.0, 0.0, 0.025));\n    float tubes = min(tubes1, tubes2);  \n    float lightsGeom = min(tubes, innerCylinders);\n    \n    float resultCylinders = min(cuttedCylinders, lightsGeom);\n    \n    float spheres = sdSphere(vec3(repPos.x, pos.y, repPos.z), (s*0.5+0.5)*1.5);\n    float light = min(tubes, spheres);\n    \n    vec2 planeMod = abs(fract(pos.xx * vec2(0.25, 4.0) + 0.5) * 4.0 - 2.0) - 1.0;\n    float planeMod2 = clamp(planeMod.y, -0.02, 0.02) * min(0.0, planeMod.x);\n    float cylindersCutPlane = sdCylinder(vec3(repPos.x, pos.y, repPos.z), vec3(0.0, 0.0, 0.6));\n    float spheresCutPlane = sdSphere(vec3(repPos.x, pos.y, repPos.z), 1.3);\n    \n    float plane = 1.0 - abs(pos.y + clamp(planeMod.x, -0.04, 0.04) + planeMod2);\n    float t = tunnel(pos.xzy * vec3(1.0, 1.0, 3.0), vec3(0.0, 0.0, 8.5));\n    float cutTunnel = sdBox(vec3(pos.x, pos.y, repPos.z), vec3(100.0, 100.0, 0.1));\n    plane = min(max(-cutTunnel, t), max(-spheresCutPlane, max(-cylindersCutPlane, plane)));\n    \n    float dist = min(resultCylinders, plane);\n    float occ = min(cuttedCylinders, plane);\n    \n    float id = 0.0;\n    \n    if(lightsGeom < epsilon)\n    {\n       id = 1.0; \n    }\n    \n\treturn vec4(dist, id, light, occ);\n}\n\nvec3 rayMarch(vec3 rayDir, vec3 cameraOrigin)\n{\n    const int maxItter = 100;\n\tconst float maxDist = 30.0;\n    \n    float totalDist = 0.0;\n\tvec3 pos = cameraOrigin;\n\tvec4 dist = vec4(epsilon);\n    \n    for(int i = 0; i < maxItter; i++)\n\t{\n\t\tdist = distfunc(pos);\n\t\ttotalDist += dist.x;\n\t\tpos += dist.x * rayDir;\n        \n        if(dist.x < epsilon || totalDist > maxDist)\n\t\t{\n\t\t\tbreak;\n\t\t}\n\t}\n    \n    return vec3(dist.x, totalDist, dist.y);\n}\n\nvec3 rayMarchReflection(vec3 rayDir, vec3 cameraOrigin)\n{\n    const int maxItter = 30;\n\tconst float maxDist = 20.0;\n    \n    float totalDist = 0.0;\n\tvec3 pos = cameraOrigin;\n\tvec4 dist = vec4(epsilon);\n\n    for(int i = 0; i < maxItter; i++)\n\t{\n\t\tdist = distfunc(pos);\n\t\ttotalDist += dist.x;\n\t\tpos += dist.x * rayDir;\n        \n        if(dist.x < epsilon || totalDist > maxDist)\n\t\t{\n\t\t\tbreak;\n\t\t}\n\t}\n    \n    return vec3(dist.x, totalDist, dist.y);\n}\n\n//Inpired From iq's ao :\n//https://www.shadertoy.com/view/Xds3zN\nvec2 AOandFakeAreaLights(vec3 pos, vec3 n)\n{\n\tvec4 res = vec4(0.0);\n    \n\tfor( int i=0; i<3; i++ )\n\t{\n\t\tvec3 aopos = pos + n*0.3*float(i);\n\t\tvec4 d = distfunc(aopos);\n\t\tres += d;\n\t}\n    \n    float ao = clamp(res.w, 0.0, 1.0);\n    float light = 1.0 - clamp(res.z*0.3, 0.0, 1.0);\n    \n\treturn vec2(ao, light * ao);   \n}\n\n//Camera Function by iq :\n//https://www.shadertoy.com/view/Xds3zN\nmat3 setCamera( in vec3 ro, in vec3 ta, float cr )\n{\n\tvec3 cw = normalize(ta-ro);\n\tvec3 cp = vec3(sin(cr), cos(cr),0.0);\n\tvec3 cu = normalize( cross(cw,cp) );\n\tvec3 cv = normalize( cross(cu,cw) );\n    return mat3( cu, cv, cw );\n}\n\n//Normal and Curvature Function by Nimitz;\n//https://www.shadertoy.com/view/Xts3WM\nvec4 norcurv(in vec3 p)\n{\n    vec2 e = vec2(-epsilon, epsilon);   \n    float t1 = distfunc(p + e.yxx).x, t2 = distfunc(p + e.xxy).x;\n    float t3 = distfunc(p + e.xyx).x, t4 = distfunc(p + e.yyy).x;\n\n    float curv = .25/e.y*(t1 + t2 + t3 + t4 - 4.0 * distfunc(p).x);\n    return vec4(normalize(e.yxx*t1 + e.xxy*t2 + e.xyx*t3 + e.yyy*t4), curv);\n}\n\nvec4 lighting(vec3 n, vec3 rayDir, vec3 reflectDir, vec3 pos)\n{\n    vec3 light = vec3(0.0, 0.0, 2.0 + iTime * speed);\n    vec3 lightVec = light - pos;\n\tvec3 lightDir = normalize(lightVec);\n    float atten = clamp(1.0 - length(lightVec)*0.1, 0.0, 1.0);\n    float spec = pow(max(0.0, dot(reflectDir, lightDir)), 10.0);\n    float rim = (1.0 - max(0.0, dot(-n, rayDir)));\n\n    return vec4(spec*atten*lightColor2 + rim*0.2, rim); \n}\n\nvec3 color(float id, vec3 pos)\n{\n    vec2 fp = vec2(1.0) - linearStep2(vec2(0.0), vec2(0.01), abs(fract(pos.xz * vec2(0.25, 1.0) + vec2(0.0, 0.5)) - 0.5));\n    float s = fp.y + fp.x;\n    return mix(wallsColor + s*lightColor*0.5, lightColor, id);\n}\n\nvec4 finalColor(vec3 rayDir, vec3 reflectDir, vec3 pos, vec3 normal, float ao, float id)\n{\n\tvec4 l = lighting(normal, rayDir, reflectDir, pos);\n\tvec3 col = color(id, pos);\n    float ao1 = 0.5 * ao + 0.5;\n    float ao2 = 0.25 * ao + 0.75;\n    vec3 res = (mix(col * ao1, col, id) + l.xyz) * ao2;\n\treturn vec4(res, l.w); \n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 uv = fragCoord.xy/iResolution.xy;\n    \n    float move = iTime * speed;\n    vec2 sinMove = sin((move * pi) / 16.0 + vec2(1.0, -1.0)) * vec2(5.0, 0.35);\n    float camX = sinMove.x;\n    float camY = 0.0;\n    float camZ = -5.0 + move;                 \n    vec3 cameraOrigin = vec3(camX, camY, camZ);\n    \n\tvec3 cameraTarget = vec3(0.0, 0.0, cameraOrigin.z + 10.0);\n    \n\tvec2 screenPos = uv * 2.0 - 1.0;\n    \n\tscreenPos.x *= iResolution.x/iResolution.y;\n    \n    mat3 cam = setCamera(cameraOrigin, cameraTarget, sinMove.y);\n    \n    vec3 rayDir = cam*normalize(vec3(screenPos.xy,1.0));\n    vec3 dist = rayMarch(rayDir, cameraOrigin);\n    \n    vec3 res;\n    vec2 fog;\n\n\tif(dist.x < epsilon)\n    {\n        vec3 pos = cameraOrigin + dist.y*rayDir;\n        vec4 n = norcurv(pos);\n        vec2 ao = AOandFakeAreaLights(pos, n.xyz);\n        vec3 r = reflect(rayDir, n.xyz);\n        vec3 rpos = pos + n.xyz*0.02;\n        vec3 reflectDist = rayMarchReflection(r, rpos);\n        fog = clamp(1.0 / exp(vec2(dist.y, reflectDist.y)*vec2(0.15, 0.2)), 0.0, 1.0);\n        vec4 direct = finalColor(rayDir, r, pos, n.xyz, ao.x, dist.z) + n.w*curvAmout;\n        \n        vec4 reflN;\n        vec2 reflAO;\n        vec3 reflFinal;\n        \n        if(reflectDist.x < epsilon)\n    \t{\n        \tvec3 reflPos = rpos + reflectDist.y*r;\n        \treflN = norcurv(reflPos);\n            reflAO = AOandFakeAreaLights(reflPos, reflN.xyz);\n            vec3 rr = reflect(r, reflN.xyz);\n            vec4 refl = finalColor(r, rr, reflPos, reflN.xyz, reflAO.x, reflectDist.z);\n            vec3 reflAreaLights = reflAO.y * lightColor * 0.5;\n            reflFinal = (refl.xyz + reflN.w*curvAmout + reflAreaLights) * fog.y * reflAmout * direct.w;\n        }\n        else   \n        {\n            reflFinal = vec3(0.0, 0.0, 0.0);\n        }\n        \n        vec3 areaLightsColor = ao.y * lightColor * 0.5;\n        \n        res = mix(fogColor, direct.xyz + reflFinal + areaLightsColor, fog.x);\n    }\n    else\n    {\n        res = fogColor; \n        fog = vec2(0.0);\n    }\n    \n\tfragColor = vec4(res, (dist.z) * fog);\n}",
            "name": "Buffer A",
            "description": "",
            "type": "buffer"
          },
          {
            "outputs": [
              {
                "channel": 0,
                "id": "XsXGR8"
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
              },
              {
                "channel": 1,
                "type": "buffer",
                "id": "XsXGR8",
                "filepath": "/media/previz/buffer01.png",
                "sampler": {
                  "filter": "linear",
                  "wrap": "clamp",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "const float radialBlurInstensity = 0.01;\nconst float speed = 3.0;\nconst float pi = 3.14159265359;\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    float s = sin(iTime*speed * pi / 16.0 - 1.0);\n    vec2 radialBlurCenter = vec2((s * 0.5 + 0.5) * 0.5 + 0.25, abs(s)* 0.2 + 0.35);\n    \n\tvec2 uv = fragCoord.xy/iResolution.xy;\n    vec2 uvCenter = uv - radialBlurCenter;\n    float c = length(uv - radialBlurCenter);\n    vec4 texBlurred = texture(iChannel0, uv);\n    \n    float itter = 0.0;\n    \n\tfor(float itter1 = 0.0; itter1 < 5.0; itter1++)\n    {\n        itter = itter1;\n        texBlurred += texture(iChannel0, uvCenter * (1.0 - radialBlurInstensity * \n        itter1 * c) + radialBlurCenter);\n    }\n    \n    vec4 res = texBlurred / itter;\n        \n    vec4 prev = texture(iChannel1, uv);\n\n    float motionBlur = mix(res.w, prev.w, 0.75);\n    vec3 light = motionBlur * vec3(0.25, 0.5, 0.75);\n\tfragColor = vec4(res.xyz + light*2.0, motionBlur);\n}",
            "name": "Buffer B",
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
          "id": "MlscDj",
          "date": "1507894704",
          "viewed": 9217,
          "name": "Neon World",
          "username": "zguerrero",
          "description": "experimenting witch ray marching and distance field",
          "likes": 204,
          "published": 1,
          "flags": 32,
          "usePreview": 0,
          "tags": [
            "reflection",
            "ray",
            "light",
            "marching",
            "distance",
            "field",
            "neon"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);
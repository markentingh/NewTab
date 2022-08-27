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
            "code": "#define PI 3.1415926535\n#define STEPS 50\n\nmat2 rot( in float a ) {\n    float c = cos(a);\n    float s = sin(a);\n\treturn mat2(c,s,-s,c);\t\n}\n\n// noise function\nfloat noise( in vec2 p ) {\t\n    p *= rot(1.941611);\n    return sin(p.x) * .25 + sin(p.y) * .25 + .50;\n}\n\n// get the 2 closest point with the projected height as z\nvoid grid( in vec2 p, inout vec3 projClosest, inout vec3 projSecondClosest ) {\n    vec2 center = floor(p) + 0.5;\n    vec2 secondBestCenter = center;\n    float secondBestDist = 99999.9;\n    vec2 bestCenter = center;\n    float bestDist = 99999.9;\n    \n    for (int y = -1 ; y <= 1 ; y++)\n    for (int x = -1 ; x <= 1 ; x++) {\n\t\tvec2 currentCenter = center + vec2(x, y);\n        // vary each center a bit\n       \tcurrentCenter.x += noise( \n            iTime * vec2(0.5124, 0.5894) + \n            currentCenter * vec2(1.3124, 1.7894)) * 1.0 - 0.5;\n        currentCenter.y += noise( \n            iTime * vec2(0.5565, 0.5561) - \n            currentCenter * vec2(1.5124, 1.6053)) * 1.0 - 0.5;\n        \n        vec2 delta = p - currentCenter;\n        float currentDist = dot(delta, delta)*0.5;\n        // use an analytical if to avoid the branch\n        float if1 = step(currentDist, bestDist);\n        float if1m = 1.0 - if1;\n        secondBestCenter = if1*bestCenter + if1m*secondBestCenter;\n        secondBestDist = if1*bestDist + if1m*secondBestDist;\n        bestCenter = if1*currentCenter + if1m*bestCenter;\n        bestDist = if1*currentDist + if1m*bestDist;\n        // else if\n        float if2 = step(currentDist, secondBestDist)*if1m;\n        float if2m = 1.0 - if2;\n        secondBestCenter = if2*currentCenter + if2m*secondBestCenter;\n        secondBestDist = if2*currentDist + if2m*secondBestDist;\n\n    }\n    \n    projClosest = vec3(bestCenter, bestDist);\n    projSecondClosest = vec3(secondBestCenter, secondBestDist);\n\n}\n\n// normal function\nvec3 normal( in vec3 p, in vec3 proj ) {\n    vec2 dir = proj.xy - p.xy;\n    vec3 tang = vec3(dir, proj.z*0.12);\n    vec3 nine = vec3(dir, 0).yxz;\n    nine.x = -nine.x;\n    return normalize(cross(nine, tang));\n}\n\n// distance function\nfloat de( in vec3 p, inout vec3 projClosest, inout vec3 projSecondClosest ) {\n    // get the closest points\n    grid(p.xy, projClosest, projSecondClosest);\n    float below = 0.0;\n    below -= sin(dot(p.xy, vec2(0.005, 0.051)) * 4.0 + iTime * 0.5) * 0.4 + 0.2;\n    below -= 1.0 - projClosest.z;\n\treturn max(0.0, p.z - below);\n}\n\n// return the sun color at this direction\nvec4 getSunColor( in vec3 dir, inout float inside ) {\n    float dotp = dot(dir, vec3(-0.99, 0.0, 0.1));\n    float sunHeight = smoothstep(0.01, 0.29, dir.z);\n    inside = smoothstep(0.977, 0.979, dotp);\n    float ytemp = abs(dir.y)*dir.y;\n    float sunWave = sin(dir.z*300.0+iTime*1.846+\n                        sin(ytemp*190.0+iTime*0.45)*1.3)*0.5+0.5;\n   \tfloat sunHeight2 = smoothstep(-0.1, 0.2, dir.z);\n    sunWave = sunWave * sunHeight2 + 1.0 - sunHeight2;\n    sunWave = (1.0-smoothstep(sunHeight2, 1.0, sunWave)) * (1.0 - sunHeight2) + sunHeight2;\n    float sun = inside * sunWave;\n    return vec4(mix(vec3(0.998, 0.108, 0.47), vec3(0.988, 0.769, 0.176), sunHeight), sun);\n}\n\n// get the space color\nvec3 getSpaceColor( in vec3 dir ) {\n    float scanline = sin(dir.z * 700.0 - iTime * 5.1)*0.5+0.5;\n    scanline *= scanline;\n    vec3 color = mix(vec3(0.1, 0.16, 0.26), vec3(0.1), scanline);\n    vec2 uv = vec2(atan(dir.y, dir.x) / (2.0 * PI) + 0.5, mod(dir.z, 1.0));\n    uv.x = mod(uv.x+2.0*PI, 1.0);\n    uv.x *= 100.0;\n    uv.y *= 15.00;\n    uv *= rot(1.941611+iTime*0.00155);\n    vec2 center = floor(uv) + 0.5;\n    center.x += noise(center*48.6613) * 0.8 - 0.4;\n    center.y += noise(center*-31.1577) * 0.8 - 0.4;\n    float radius = smoothstep(0.6, 1.0, noise(center*42.487+\n                                              vec2(0.1514, 0.1355)*iTime)); \n    radius *= 0.01;\n    vec2 delta = uv-center;\n    float dist = dot(delta, delta);\n    float frac = 1.0-smoothstep(0.0, radius, dist);\n    float frac2 = frac;\n    frac2 *= frac2; frac2 *= frac2; frac2 *= frac2;\n    vec3 lightColor = mix(vec3(0.988, 0.769, 0.176), \n                          vec3(0.988, 0.434, 0.875), noise(center*74.487));\n    return mix(color, lightColor, frac) + vec3(1)*frac2;\n}\n\n// get the background color (ala cubemap)\nvec3 getBackgroundColor( in vec3 dir ) {\n    float horizon = 1.0 - smoothstep(0.0, 0.02, dir.z);\n    // this is the background with the scanline\n    vec3 color = getSpaceColor(dir);\n    // get the sun\n    float inside = 0.0;\n    vec4 sun = getSunColor(dir, inside);\n    color = mix(color, vec3(0.1, 0.16, 0.26), inside);\n    color = mix(color, sun.rgb, sun.a);\n    // the horizon\n    color = mix(color, vec3(0.43, 0.77, 0.85), horizon * (1.0 - sun.a * 0.19));\n    return color;\n}\n\n// the color gets more blue/white near edges of the voronoi cells\nvec3 getWaveColor( in vec3 p, in vec3 projClosest, in vec3 projSecondClosest,\n                  in vec3 dir, float dist, vec2 frag ) {\n    float distanceToEdge = abs(projClosest.z-projSecondClosest.z);\n    float distanceFrac = smoothstep(-10.0, 100.0, dist);\n    distanceFrac *= distanceFrac; distanceFrac *= distanceFrac;\n    float frac = smoothstep(0.0, 0.1+distanceFrac*0.9, distanceToEdge);\n    // get the reflection\n    vec3 norm = normal(p, projClosest);\n    vec3 color = getBackgroundColor(reflect(dir, norm));\n    // add a screenspace scanline\n    frac *= (sin(frag.y/iResolution.y*700.0)*0.5+0.5)*(1.0-distanceFrac);\n    return mix(vec3(0.43, 0.77, 0.85), color, frac);\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n    vec2 uv = fragCoord.xy / iResolution.xy * 2.0 - 1.0;\n\tuv.y *= iResolution.y / iResolution.x;\n\t\n\tvec3 from = vec3(0, 0, 0.2);\n\tvec3 dir = normalize(vec3(uv.x*0.6, 1.0, uv.y*-0.6));\n    \n\tdir.xy *= rot(PI*.5);\n\tvec2 mouse=(iMouse.xy / iResolution.xy - 0.5) * 0.5;\n    mouse *= step(1.0, iMouse.z);\n\tdir.xz *= rot(3.16-(-mouse.y*1.5)+sin(iTime*0.785)*0.008);\n\tdir.xy *= rot(-mouse.x*4.0+sin(iTime*0.416)*0.01);\n    dir.yz *= rot(sin(iTime*0.287)*0.009);\n    \n\tvec3 color = vec3(0);\n    \n    if (dir.z > 0.0) {\n        color = getBackgroundColor(dir);\n    } else {\n       // project the starting position to z = 0 so we ccan lower the raymarch count\n        float totdist = from.z / -dir.z;\n        for (int steps = 0 ; steps < STEPS ; steps++) {\n            vec3 p = from + totdist * dir;\n            vec3 projClosest;\n            vec3 projSecondClosest;\n            p.x -= iTime * 2.7;\n            float dist = de(p, projClosest, projSecondClosest);\n            totdist += dist;\n            if ( dist < 0.01 || steps == STEPS-1 ) {\n                color = getWaveColor(p, projClosest, projSecondClosest,\n                                     dir, totdist, fragCoord);\n                break;\n            }\n        }\n\t}\n    \n    fragColor = vec4(color, 1);\n    \n}\n",
            "name": "Image",
            "description": "",
            "type": "image"
          }
        ],
        "flags": {
          "mFlagVR": false,
          "mFlagWebcam": false,
          "mFlagSoundInput": false,
          "mFlagSoundOutput": true,
          "mFlagKeyboard": false,
          "mFlagMultipass": false,
          "mFlagMusicStream": false
        },
        "info": {
          "id": "4l2XWh",
          "date": "1443297052",
          "viewed": 8255,
          "name": "Cross-Galactic Ocean",
          "username": "Klems",
          "description": "The ocean is the voronoÃ¯ diagram of a distorted grid. The wave sound is a white noise with a low pass filter. Use your mouse to rotate the camera!",
          "likes": 148,
          "published": 3,
          "flags": 8,
          "usePreview": 0,
          "tags": [
            "3d",
            "voronoi",
            "raymarch",
            "retro",
            "water",
            "space",
            "80"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);
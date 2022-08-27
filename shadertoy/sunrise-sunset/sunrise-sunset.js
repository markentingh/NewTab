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
            "code": "precision highp float;\n\nfloat noise( vec3 x )\n{\n    vec3 p = floor(x);\n    vec3 f = fract(x);\n\tf = f*f*(3.0-2.0*f);\n\t\n\tvec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;\n\tvec2 rg = texture( iChannel0, (uv + 0.5)/256.0, -100.0 ).yx;\n\treturn mix( rg.x, rg.y, f.z );\n}\n\nfloat map(vec3 p) {\n    vec3 q = p + 0.2*vec3(3.0, 0.3, 5.0)*mod(iTime,3600.0)*2.0;\n    float n = 0.0, f = 0.5;\n    n += f*noise(q); q *= 3.001; f *= 0.333;\n    n += f*noise(q); q *= 3.002; f *= 0.332;\n\tn += f*noise(q);\n    return n;\n}\n\nfloat scene(vec3 p)\n{\n\treturn p.y+2.0-0.003*map(vec3(p.x, 0.0, p.z));\n    /*\n        +0.0175*(1.0-sin(0.5*p.z+7.5*iTime))\n        -0.01*(1.0-sin(1.0*p.z+15.0*iTime))\n        -0.005*(1.0-sin(2.0*p.z+30.0*iTime))\n        -0.0025*(1.0-sin(4.0*p.z+60.0*iTime));\n\t*/\n}\n\nvec3 normal(vec3 p, float d)\n{\n\tfloat e = 0.05;\n\tfloat dx = scene(vec3(e, 0.0, 0.0) + p) - d;\n\tfloat dy = scene(vec3(0.0, e, 0.0) + p) - d;\n\tfloat dz = scene(vec3(0.0, 0.0, e) + p) - d;\n\treturn normalize(vec3(dx, dy, dz));\n}\n\nvec3 shadeBg(vec3 nml, vec2 fragCoord)\n{\n\tvec2 aspect = vec2(iResolution.x/iResolution.y, 1.0);\n\tvec2 uv = (2.0 * fragCoord.xy / iResolution.xy - 1.0) * aspect;\n\tvec3 bgLight = normalize(vec3(\n        sin(iTime*0.5)*0.1,\n\t\tcos(iTime*0.1)*0.6-0.3,\n        -1.0\n\t));\n    float sunD = dot(bgLight, nml) > 0.995 ? 1.0 : 0.0;\n\tvec3 sun = vec3(6.5, 3.5, 2.0);\n\tfloat skyPow = dot(nml, vec3(0.0, -1.0, 0.0));\n    float centerPow = 0.0; //-dot(uv,uv);\n    float horizonPow = pow(1.0-abs(skyPow), 3.0)*(5.0+centerPow);\n\tfloat sunPow = dot(nml, bgLight);\n\tfloat sp = max(sunPow, 0.0);\n    float scattering = clamp(1.0 - abs(2.0*(-bgLight.y)), 0.0, 1.0);\n\tvec3 bgCol = max(0.0, skyPow)*2.0*vec3(0.8);\n\tbgCol += 0.5*vec3(0.8)*(horizonPow);\n\tbgCol += sun*(sunD+pow( sp, max(128.0, abs(bgLight.y)*512.0) ));\n\tbgCol += vec3(0.4,0.2,0.15)*(pow( sp, 8.0) + pow( sp, max(8.0, abs(bgLight.y)*128.0) ));\n    bgCol *= mix(vec3(0.7, 0.85, 0.95), vec3(1.0, 0.45, 0.1), scattering);\n    bgCol *= 1.0 - clamp(bgLight.y*3.0, 0.0, 0.6);\n    float cloudFac = pow(abs(skyPow), 0.8)*1.0;\n\t//bgCol += cloudFac*map(nml*2.0/nml.y);\n    //bgCol += cloudFac*map(nml*5.0/nml.y);\n    float ufCloudCover = 0.5;\n    // 0% = 0.0\n    // 10% = 0.25\n    // 20% = 0.35\n    // 30% = 0.4\n    // 50% = 0.45\n    // 75% = 0.75\n    // 100% = 1.5\n    float cc = 0.0;\n    if (ufCloudCover < 0.1) {\n        cc = 0.0 + 0.2 * (ufCloudCover - 0.0)/0.1;\n    } else if (ufCloudCover < 0.2) {\n        cc = 0.2 + 0.1 * (ufCloudCover - 0.1)/0.1;\n    } else if (ufCloudCover < 0.3) {\n        cc = 0.3 + 0.1 * (ufCloudCover - 0.2)/0.1;\n    } else if (ufCloudCover < 0.5) {\n        cc = 0.4 + 0.1 * (ufCloudCover - 0.3)/0.3;\n    } else if (ufCloudCover < 0.75) {\n        cc = 0.5 + 0.2 * pow((ufCloudCover - 0.5)/0.25, 2.0);\n    } else {\n        cc = 0.7 + 0.75 * pow((ufCloudCover - 0.75)/0.25, 2.0);\n    }\n    float cloud = 0.0;\n    cloud += min(1.0, (1.0-smoothstep(0.0, cc, map(nml/nml.y)))) * 0.4;\n    cloud += min(1.0, (1.0-smoothstep(0.0, cc, map(nml*1.03/nml.y)))) * 0.4;\n    cloud += min(1.0, (1.0-smoothstep(0.0, cc, map(nml*3.0/nml.y)))) * 0.3;\n    bgCol *= 1.0+cloudFac*cloud;\n\n\treturn pow(max(vec3(0.0), bgCol), vec3(2.6));\n}\n\nmat3 rotationXY( vec2 angle ) {\n\tfloat cp = cos( angle.x );\n\tfloat sp = sin( angle.x );\n\tfloat cy = cos( angle.y );\n\tfloat sy = sin( angle.y );\n\n\treturn mat3(\n         cy, -sy, 0.0,\n         sy,  cy, 0.0,\n        0.0, 0.0, 1.0\n\t) * mat3(\n        cp, 0.0, -sp,\n        0.0, 1.0, 0.0,\n        sp, 0.0, cp\n    );\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n\tvec2 aspect = vec2(iResolution.x/iResolution.y, 1.0);\n\tvec2 uv = (2.0 * (fragCoord.xy / iResolution.xy) - 1.0) * aspect;\n    mat3 rot = rotationXY( vec2( 0.2+0.2*cos(0.5*iTime), -0.15*sin(0.5+0.5*iTime) ) );\n\tvec3 d = rot * normalize(vec3(uv, 1.0));\n\tvec3 p = vec3(uv*-2.0, -9.5);\n    vec3 tr = vec3(1.0);\n    if (d.y < 0.0) {\n        float dist = -2.0 / d.y - p.y / d.y; // p.y + d.y * dist = -2.0;\n        p += d * dist;\n        vec3 nml = normal(p, 0.0);\n        float f = pow(1.0-dot(d, -vec3(0.0, 1.0, 0.0)), 5.0);\n        nml = mix(nml, vec3(0.0, 1.0, 0.0), f);\n        d = reflect(d, nml);\n        tr *= mix(0.5*vec3(0.5, 0.9, 0.75), vec3(1.0), f);\n    }\n    \n    vec3 col = tr * shadeBg(-d, fragCoord);\n    \n    vec4 noise = (texture(iChannel0, mod(fragCoord.xy/256.0, 1.0))-0.5) / 64.0;\n\tfragColor = pow(vec4( noise.rgb + (1.0 - exp(-1.3 * col.rgb)), 1.0 ), vec4(1.3));\n}",
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
          "id": "XsBXDc",
          "date": "1419953711",
          "viewed": 5156,
          "name": "Sunrise, sunset",
          "username": "kig",
          "description": "Totally fake sky colors but looks cheerful :D",
          "likes": 73,
          "published": 3,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "clouds",
            "scattering",
            "hack"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
    }
]

compileAndStart(jsnShader);
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
                "id": "4dfGRn",
                "filepath": "/media/a/8de3a3924cb95bd0e95a443fff0326c869f9d4979cd1d5b6e94e2a01f5be53e9.jpg",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// I started working a bit on the colors of Remix 2, ended up with something like this. :)\n// Remix 2 here: https://www.shadertoy.com/view/MtcGD7\n// Remix 1 here: https://www.shadertoy.com/view/llc3DM\n// Original here: https://www.shadertoy.com/view/XsXXRN\n\nfloat rand(vec2 n) {\n    return fract(sin(cos(dot(n, vec2(12.9898,12.1414)))) * 83758.5453);\n}\n\nfloat noise(vec2 n) {\n    const vec2 d = vec2(0.0, 1.0);\n    vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));\n    return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);\n}\n\nfloat fbm(vec2 n) {\n    float total = 0.0, amplitude = 1.0;\n    for (int i = 0; i <5; i++) {\n        total += noise(n) * amplitude;\n        n += n*1.7;\n        amplitude *= 0.47;\n    }\n    return total;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n\n    const vec3 c1 = vec3(0.5, 0.0, 0.1);\n    const vec3 c2 = vec3(0.9, 0.1, 0.0);\n    const vec3 c3 = vec3(0.2, 0.1, 0.7);\n    const vec3 c4 = vec3(1.0, 0.9, 0.1);\n    const vec3 c5 = vec3(0.1);\n    const vec3 c6 = vec3(0.9);\n\n    vec2 speed = vec2(0.1, 0.9);\n    float shift = 1.327+sin(iTime*2.0)/2.4;\n    float alpha = 1.0;\n    \n\tfloat dist = 3.5-sin(iTime*0.4)/1.89;\n    \n    vec2 uv = fragCoord.xy / iResolution.xy;\n    vec2 p = fragCoord.xy * dist / iResolution.xx;\n    p += sin(p.yx*4.0+vec2(.2,-.3)*iTime)*0.04;\n    p += sin(p.yx*8.0+vec2(.6,+.1)*iTime)*0.01;\n    \n    p.x -= iTime/1.1;\n    float q = fbm(p - iTime * 0.3+1.0*sin(iTime+0.5)/2.0);\n    float qb = fbm(p - iTime * 0.4+0.1*cos(iTime)/2.0);\n    float q2 = fbm(p - iTime * 0.44 - 5.0*cos(iTime)/2.0) - 6.0;\n    float q3 = fbm(p - iTime * 0.9 - 10.0*cos(iTime)/15.0)-4.0;\n    float q4 = fbm(p - iTime * 1.4 - 20.0*sin(iTime)/14.0)+2.0;\n    q = (q + qb - .4 * q2 -2.0*q3  + .6*q4)/3.8;\n    vec2 r = vec2(fbm(p + q /2.0 + iTime * speed.x - p.x - p.y), fbm(p + q - iTime * speed.y));\n    vec3 c = mix(c1, c2, fbm(p + r)) + mix(c3, c4, r.x) - mix(c5, c6, r.y);\n    vec3 color = vec3(1.0/(pow(c+1.61,vec3(4.0))) * cos(shift * fragCoord.y / iResolution.y));\n    \n    color=vec3(1.0,.2,.05)/(pow((r.y+r.y)* max(.0,p.y)+0.1, 4.0));;\n    color += (texture(iChannel0,uv*0.6+vec2(.5,.1)).xyz*0.01*pow((r.y+r.y)*.65,5.0)+0.055)*mix( vec3(.9,.4,.3),vec3(.7,.5,.2), uv.y);\n    color = color/(1.0+max(vec3(0),color));\n    fragColor = vec4(color.x, color.y, color.z, alpha);\n}",
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
          "id": "4ttGWM",
          "date": "1469618650",
          "viewed": 16256,
          "name": "301's Fire Shader - Remix 3",
          "username": "mu6k",
          "description": "Sorry, I couln't resist :P. This is another take on the plasma-fire effect. Original code by CaliCoastReplay and 301.",
          "likes": 181,
          "published": 3,
          "flags": 0,
          "usePreview": 1,
          "tags": [
            "flame",
            "fire",
            "blaze"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);
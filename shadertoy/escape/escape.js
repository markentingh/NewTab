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
                "id": "XdXGzn",
                "filepath": "/media/a/3083c722c0c738cad0f468383167a0d246f91af2bfa373e9c5c094fb8c8413e0.png",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              },
              {
                "channel": 2,
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
            "code": "//Motion blur from mu6k: https://www.shadertoy.com/view/lsyXRK\n\nvec2 totex(vec2 p)\n{\n    p.x=p.x*iResolution.y/iResolution.x+0.5;\n    p.y+=0.5;\n    return p; \n}\n\nvec3 sample_color(vec2 p)\n{\n    return texture(iChannel2, totex(p)).xyz;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 uv = fragCoord.xy / iResolution.xy;\n\tvec2 p = (fragCoord.xy - iResolution.xy*.5) / iResolution.yy;\n    \n    \n    vec4 fb = texture(iChannel2, uv);\n    \n    float amp =1./fb.w*0.1;\n    vec4 noise = texture(iChannel0, (fragCoord+floor(iTime*vec2(12.0,56.0)))/64.0);\n\t\n   \tvec3 col = vec3(0.0);\n    col += sample_color(p*((noise.x+2.0)*amp+1.0));\n    col += sample_color(p*((noise.y+1.0)*amp+1.0));\n    col +=sample_color(p*((noise.z+0.0)*amp+1.0));\n    col += sample_color(p*((noise.w-1.0)*amp+1.0));\n    col += sample_color( p*((noise.x-2.0)*amp+1.0));\n    col *= 0.2;\n    col.y*=1.2;\n    col=pow(clamp(col,0.0,1.0),vec3(0.45)); \n    col=mix(col, vec3(dot(col, vec3(0.33))), -0.5);\n    \n    fragColor = vec4(col, 1.0);\n}",
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
                "id": "4sXGRn",
                "filepath": "/media/a/95b90082f799f48677b4f206d856ad572f1d178c676269eac6347631d4447258.jpg",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              },
              {
                "channel": 1,
                "type": "texture",
                "id": "XsfGRn",
                "filepath": "/media/a/1f7dca9c22f324751f2a5a59c9b181dfe3b5564a04b724c657732d0bf09c99db.jpg",
                "sampler": {
                  "filter": "nearest",
                  "wrap": "repeat",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// Created by evilryu\n// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.\n\n\t\n#define PI 3.1415926535898\nfloat matid = 0.0;\nfloat tdist = 0.0;\nvec3 hash(float n)\n{ \n    return fract(sin(vec3(n,n+1.0,n+2.0))*vec3(43758.5453123, 22578.1459123, 19642.3490423)); \n} \n\nfloat box(vec3 p, vec3 b)\n{\n  \tvec3 d = abs(p) - b;\n  \treturn min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));\n}\n\nfloat infi_box(vec3 p, vec2 b)\n{\n    vec2 d = abs(p.xy) - b;\n    return min(max(d.x, d.y), 0.0) + length(max(d,0.0));\n}\n\nvec3 path(float p)\n{\n    return vec3(sin(p*0.05)*cos(p*0.025)*18., 0.,0.);\n}\n\nfloat infi_cylinder(vec3 p, vec2 h)\n{\n\tp.yz=p.zy;\n    float d = abs(length(p.xz)-h.x);\n    return min(d,0.0)+max(d,0.0);\n}\n\nfloat cylinder(vec3 p, vec2 h)\n{\n\tp.yz=p.zy;\n  \tvec2 d = abs(vec2(length(p.xz),p.y)) - h;\n  \treturn min(max(d.x,d.y),0.0) + length(max(d,0.0));\n}\n\nvec3 map(vec3 pos)\n{\n    vec3 p=pos-path(pos.z);\n    float d = 2.0 - length(p.xy);\n    float d0 = length(vec3(p.x,-0.5,p.z)-p);\n    float d1 = length(vec3(p.x,1.2,p.z)-p);\n    float d2 = cylinder(vec3(abs(p.x)-1.6,p.y-1.15,mod(p.z,2.0)-1.), \n                   vec2(0.06,0.2));\n    float d3 = infi_box(vec3(abs(p.x)-1.8,p.y+0.5,p.z), \n                   vec2(0.5,0.03));\n    float d4 = infi_box(vec3(abs(p.x)-1.3,p.y+0.5,p.z), \n                   vec2(0.015,0.04));\n    float d5 = box(vec3(abs(p.x)-1.99,p.y+0.2,mod(p.z,8.0)-4.), \n                   vec3(0.02,0.02,0.02));\n\n    matid=0.0;\n    if(d0 < d){d=d0;matid=1.0;}\n    if(d1 < d){d=d1;matid=2.0;}\n    if(d2 < d){d=d2;matid=3.0;}\n    if(d3 < d){d=d3;matid=1.0;}\n    if(d4 < d){d=d4;matid=1.0;}\n    if(d5 < d){d=d5;matid=4.0;}\n\n\treturn vec3(d);\n}\n\nvec3 get_normal(vec3 p) {\n\tconst vec2 e = vec2(0.002, 0);\n\treturn normalize(vec3(map(p + e.xyy).x-map(p - e.xyy).x, \n                          map(p + e.yxy).x-map(p - e.yxy).x,\t\n                          map(p + e.yyx).x-map(p - e.yyx).x));\n}\n\nfloat get_ao(vec3 p, vec3 n)\n{\n    float r = 0.0, w = 1.0, d;\n    for(float i=1.0; i<5.0+1.1; i++)\n    {\n        d = i/5.0;\n        r += w*(d - map(p + n*d).x);\n        w *= 0.5;\n    }\n    return 1.0-clamp(r,0.0,1.0);\n}\n\nfloat intersect(vec3 ro, vec3 rd)\n{\n    vec3 res;\n    float t = 0.01;\n    for(int i = 0; i < 128; ++i)\n    {\n        vec3 p = ro + rd * t;\n        res = map(p);\n        if(res.x < 0.005 * t || res.x > 20.)\n            break;\n        t += res.x;\n        tdist=t;\n    }\n    \n    if(res.x > 20.) t = -1.;\n    return t;\n}\n\nvec4 texcube( sampler2D sam, in vec3 p, in vec3 n )\n{\n\tvec4 x = texture( sam, p.yz );\n\tvec4 y = texture( sam, p.zx );\n\tvec4 z = texture( sam, p.xy );\n\treturn x*abs(n.x) + y*abs(n.y) + z*abs(n.z);\n}\n\nvec3 lighting(vec3 rd, vec3 ro, vec3 lp0, vec3 pos, vec3 n)\n{\n    vec3 p=pos-path(pos.z);\n\n    float r = sqrt(p.x*p.x + p.y*p.y);\n    float a = atan(p.y, p.x);\n    vec2 uv=vec2(p.z*0.1,a*0.1);\n\n    vec3 mate = vec3(1.0);\n    \n    if(matid < 0.9)\n    \tmate=(0.35+3.5*pow(p.y,5.0))*texture(iChannel0, uv).xxx;\n    else if(matid < 1.9 || matid < 2.9)\n    {\n        mate=0.5*texcube(iChannel1, p,n).xxx;\n    }\n    else if(matid < 3.9)\n    \tmate=10.0*vec3(0.7,0.8,1.2);\n    else if(matid < 4.9)\n        mate=10.0*vec3(1.0,1.0,0.1);\n \n    if(p.y<0.5)\n    {\n    \tmate+=(1.-smoothstep(0.05,0.06,abs(abs(p.x)-1.1)))*vec3(1);\n\t\tmate=mix(mate,vec3(1.),\n                 floor(fract(p.z*.5)+.5)*(1.-smoothstep(0.04,0.05,abs(p.x)-0.001)));\n    }  \n\n    if(matid > 1.9 && matid < 2.9)\n    \tmate+=.5*smoothstep(0.8,1.5,abs(p.x));\n        \n    vec3 ld0 = normalize(lp0 - pos);\n\n    float dif = max(0.0, dot(n, ld0));\n    float spe = max(0.0, pow(clamp(dot(ld0, reflect(rd, n)), 0.0, 1.0), 20.0));\n    float ao = get_ao(pos, n);\n    vec3 lin = 4.0*vec3(0.1, 0.5, 1.0) * dif * ao * ao;\n    lin += 2.5 * vec3(1.0)*spe;\n   \tlin = lin*0.2*mate;\n\n    return lin;\n}\n\nvec3 shade(vec3 ro, vec3 rd, vec3 l0_pos)\n{\n    vec3 col = rd;\n    \n    float res = intersect(ro, rd);\n    \n    if(res > -0.5)\n    {\n        vec3 pos = ro + rd * res;\n        vec3 n = get_normal(pos);\n        col = lighting(rd,ro, l0_pos, pos, n);\n    }\n    return col;\n}\n\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n\tvec2 uv = (fragCoord.xy - iResolution.xy * 0.5)/ iResolution.xy;\n    uv.x *= iResolution.x / iResolution.y;\n    \n    float velocity = 8.0;\n    \n    float fov = PI / 3.;\n\n    vec3 look_at = vec3(0.0, 0.0, iTime * velocity);\n\tvec3 ro = look_at + vec3(0.0, 0.0, -0.5);\n    \n    vec3 l0_pos = ro + vec3(0.0, 0.0, 2.0);\n\n\tlook_at += path(look_at.z);\n\tro += path(ro.z);\n   \tl0_pos += path(l0_pos.z);\n\n    vec3 forward = normalize(look_at - ro);\n \tvec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));   \n    vec3 up = cross(right, forward);\n    \n    vec3 rd = normalize(uv.x * right + uv.y * up + fov * forward);\n    \n    vec3 col = shade(ro, rd, l0_pos);\n   \tcol=mix(col, 0.15*vec3(0.4,0.75,1.0), 1.0-exp(-0.002*tdist*tdist) );\n\n\tfragColor = vec4(col, tdist);\n}",
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
          "id": "4lcGWr",
          "date": "1468767970",
          "viewed": 13623,
          "name": "[SH16B]Escape",
          "username": "EvilRyu",
          "description": "Better watch fullscreen!\nStill want to add more stuff, but have no enough time.\n",
          "likes": 151,
          "published": 3,
          "flags": 32,
          "usePreview": 1,
          "tags": [
            "tunnel",
            "speed"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);
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
            "code": "// Visualization of the system in Buffer A\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 texel = 1. / iResolution.xy;\n    vec2 uv = fragCoord.xy / iResolution.xy;\n    vec3 c = texture(iChannel0, uv).xyz;\n    vec3 norm = normalize(c);\n    \n    vec3 div = vec3(0.1) * norm.z;    \n    vec3 rbcol = 0.5 + 0.6 * cross(norm.xyz, vec3(0.5, -0.4, 0.5));\n    \n    fragColor = vec4(rbcol + div, 0.0);\n}",
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
                "channel": 3,
                "type": "keyboard",
                "id": "4dXGRr",
                "filepath": "/presets/tex00.jpg",
                "sampler": {
                  "filter": "linear",
                  "wrap": "clamp",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// Begin IQ's simplex noise:\n\n// The MIT License\n// Copyright © 2013 Inigo Quilez\n// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the \"Software\"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n\nvec2 hash( vec2 p ) // replace this by something better\n{\n\tp = vec2( dot(p,vec2(127.1,311.7)),\n\t\t\t  dot(p,vec2(269.5,183.3)) );\n\n\treturn -1.0 + 2.0*fract(sin(p)*43758.5453123);\n}\n\nfloat noise( in vec2 p )\n{\n    const float K1 = 0.366025404; // (sqrt(3)-1)/2;\n    const float K2 = 0.211324865; // (3-sqrt(3))/6;\n\n\tvec2 i = floor( p + (p.x+p.y)*K1 );\n\t\n    vec2 a = p - i + (i.x+i.y)*K2;\n    vec2 o = step(a.yx,a.xy);    \n    vec2 b = a - o + K2;\n\tvec2 c = a - 1.0 + 2.0*K2;\n\n    vec3 h = max( 0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );\n\n\tvec3 n = h*h*h*h*vec3( dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0)));\n\n    return dot( n, vec3(70.0) );\n\t\n}\n\n// End IQ's simplex noise\n\nbool reset() {\n    return texture(iChannel3, vec2(32.5/256.0, 0.5) ).x > 0.5;\n}\n\nvec2 normz(vec2 x) {\n\treturn x == vec2(0.0, 0.0) ? vec2(0.0, 0.0) : normalize(x);\n}\n\n// reverse advection\nvec3 advect(vec2 ab, vec2 vUv, vec2 step, float sc) {\n    \n    vec2 aUv = vUv - ab * sc * step;\n    \n    const float _G0 = 0.25; // center weight\n    const float _G1 = 0.125; // edge-neighbors\n    const float _G2 = 0.0625; // vertex-neighbors\n    \n    // 3x3 neighborhood coordinates\n    float step_x = step.x;\n    float step_y = step.y;\n    vec2 n  = vec2(0.0, step_y);\n    vec2 ne = vec2(step_x, step_y);\n    vec2 e  = vec2(step_x, 0.0);\n    vec2 se = vec2(step_x, -step_y);\n    vec2 s  = vec2(0.0, -step_y);\n    vec2 sw = vec2(-step_x, -step_y);\n    vec2 w  = vec2(-step_x, 0.0);\n    vec2 nw = vec2(-step_x, step_y);\n\n    vec3 uv =    texture(iChannel0, fract(aUv)).xyz;\n    vec3 uv_n =  texture(iChannel0, fract(aUv+n)).xyz;\n    vec3 uv_e =  texture(iChannel0, fract(aUv+e)).xyz;\n    vec3 uv_s =  texture(iChannel0, fract(aUv+s)).xyz;\n    vec3 uv_w =  texture(iChannel0, fract(aUv+w)).xyz;\n    vec3 uv_nw = texture(iChannel0, fract(aUv+nw)).xyz;\n    vec3 uv_sw = texture(iChannel0, fract(aUv+sw)).xyz;\n    vec3 uv_ne = texture(iChannel0, fract(aUv+ne)).xyz;\n    vec3 uv_se = texture(iChannel0, fract(aUv+se)).xyz;\n    \n    return _G0*uv + _G1*(uv_n + uv_e + uv_w + uv_s) + _G2*(uv_nw + uv_sw + uv_ne + uv_se);\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    const float _K0 = -20.0/6.0; // center weight\n    const float _K1 = 4.0/6.0;   // edge-neighbors\n    const float _K2 = 1.0/6.0;   // vertex-neighbors\n    const float cs = -0.6;  // curl scale\n    const float ls = 0.05;  // laplacian scale\n    const float ps = -0.8;  // laplacian of divergence scale\n    const float ds = -0.05; // divergence scale\n    const float dp = -0.04; // divergence update scale\n    const float pl = 0.3;   // divergence smoothing\n    const float ad = 6.0;   // advection distance scale\n    const float pwr = 1.0;  // power when deriving rotation angle from curl\n    const float amp = 1.0;  // self-amplification\n    const float upd = 0.8;  // update smoothing\n    const float sq2 = 0.6;  // diagonal weight\n\n    vec2 vUv = fragCoord.xy / iResolution.xy;\n    vec2 texel = 1. / iResolution.xy;\n    \n    // 3x3 neighborhood coordinates\n    float step_x = texel.x;\n    float step_y = texel.y;\n    vec2 n  = vec2(0.0, step_y);\n    vec2 ne = vec2(step_x, step_y);\n    vec2 e  = vec2(step_x, 0.0);\n    vec2 se = vec2(step_x, -step_y);\n    vec2 s  = vec2(0.0, -step_y);\n    vec2 sw = vec2(-step_x, -step_y);\n    vec2 w  = vec2(-step_x, 0.0);\n    vec2 nw = vec2(-step_x, step_y);\n\n    vec3 uv =    texture(iChannel0, fract(vUv)).xyz;\n    vec3 uv_n =  texture(iChannel0, fract(vUv+n)).xyz;\n    vec3 uv_e =  texture(iChannel0, fract(vUv+e)).xyz;\n    vec3 uv_s =  texture(iChannel0, fract(vUv+s)).xyz;\n    vec3 uv_w =  texture(iChannel0, fract(vUv+w)).xyz;\n    vec3 uv_nw = texture(iChannel0, fract(vUv+nw)).xyz;\n    vec3 uv_sw = texture(iChannel0, fract(vUv+sw)).xyz;\n    vec3 uv_ne = texture(iChannel0, fract(vUv+ne)).xyz;\n    vec3 uv_se = texture(iChannel0, fract(vUv+se)).xyz;\n    \n    // uv.x and uv.y are the x and y components, uv.z is divergence \n\n    // laplacian of all components\n    vec3 lapl  = _K0*uv + _K1*(uv_n + uv_e + uv_w + uv_s) + _K2*(uv_nw + uv_sw + uv_ne + uv_se);\n    float sp = ps * lapl.z;\n    \n    // calculate curl\n    // vectors point clockwise about the center point\n    float curl = uv_n.x - uv_s.x - uv_e.y + uv_w.y + sq2 * (uv_nw.x + uv_nw.y + uv_ne.x - uv_ne.y + uv_sw.y - uv_sw.x - uv_se.y - uv_se.x);\n    \n    // compute angle of rotation from curl\n    float sc = cs * sign(curl) * pow(abs(curl), pwr);\n    \n    // calculate divergence\n    // vectors point inwards towards the center point\n    float div  = uv_s.y - uv_n.y - uv_e.x + uv_w.x + sq2 * (uv_nw.x - uv_nw.y - uv_ne.x - uv_ne.y + uv_sw.x + uv_sw.y + uv_se.y - uv_se.x);\n    float sd = uv.z + dp * div + pl * lapl.z;\n\n    vec2 norm = normz(uv.xy);\n    \n    vec3 ab = advect(vec2(uv.x, uv.y), vUv, texel, ad);\n    \n    // temp values for the update rule\n    float ta = amp * ab.x + ls * lapl.x + norm.x * sp + uv.x * ds * sd;\n    float tb = amp * ab.y + ls * lapl.y + norm.y * sp + uv.y * ds * sd;\n\n    // rotate\n    float a = ta * cos(sc) - tb * sin(sc);\n    float b = ta * sin(sc) + tb * cos(sc);\n    \n    vec3 abd = upd * uv + (1.0 - upd) * vec3(a,b,sd);\n    \n    if (iMouse.z > 0.0) {\n    \tvec2 d = fragCoord.xy - iMouse.xy;\n        float m = exp(-length(d) / 10.0);\n        abd.xy += m * normz(d);\n    }\n    \n    // initialize with noise\n    if(iFrame<10 || reset()) {\n        vec3 rnd = vec3(noise(16.0 * vUv + 1.1), noise(16.0 * vUv + 2.2), noise(16.0 * vUv + 3.3));\n        fragColor = vec4(rnd, 0);\n        //fragColor = -0.5 + texture(iChannel1, fragCoord.xy / iResolution.xy);\n    } else {\n        //fragColor = clamp(vec4(abd,0.0), -1., 1.);\n        abd.z = clamp(abd.z, -1.0, 1.0);\n        abd.xy = clamp(length(abd.xy) > 1.0 ? normz(abd.xy) : abd.xy, -1.0, 1.0);\n        fragColor = vec4(abd, 0.0);\n    }\n    \n\n}",
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
          "mFlagKeyboard": true,
          "mFlagMultipass": true,
          "mFlagMusicStream": false
        },
        "info": {
          "id": "XddSRX",
          "date": "1460676359",
          "viewed": 22884,
          "name": "Suture Fluid",
          "username": "cornusammonis",
          "description": "Fake fluid dynamical system that creates viscous-fingering-like flow patterns, and suturing patterns along boundaries. Try letting it evolve for a while in fullscreen. Use the mouse to paint, spacebar resets the system (useful in fullscreen).",
          "likes": 407,
          "published": 3,
          "flags": 48,
          "usePreview": 0,
          "tags": [
            "diffusion",
            "advection",
            "reaction",
            "viscousfingering"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);
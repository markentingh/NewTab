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
                "id": "XdXGzr",
                "filepath": "/media/a/8979352a182bde7c3c651ba2b2f4e0615de819585cc37b7175bcefbca15a6683.jpg",
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
                "type": "texture",
                "id": "4df3Rr",
                "filepath": "/media/a/3871e838723dd6b166e490664eead8ec60aedd6b8d95bc8e2fe3f882f0fd90f0.jpg",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// [SH17A] Lava Planet\n// @P_Malin\n// https://www.shadertoy.com/view/ldBfDR\n\n\n// There was more potential in this code so I made a variation without the 280 character limit here:\n// https://www.shadertoy.com/view/4dBBDD\n\n// Also see the annotated version by @morgan3d explaining what is going on a bit more here:\n// https://www.shadertoy.com/view/Mdjfzd\n\n#define T texture(iChannel0,c*.1)\n\nvoid mainImage( out vec4 f, vec2 c )\n{\n    vec4 d = vec4( c / iResolution.x, 1, 1 ) - .5, // 'view' (d)irection\n        o, // (o)ffset from camera\n        g, // (g)low amount\n        t, // '(t)exture'\n        l; // '(l)andscape'\n\t\n\t//d.z += d.y * .5; // More dramatic camera projection\n    \n    o = f *= 0.; // required for GL\n    \n    for ( float h=0.; h<.6; h+=.001 ) // terrain slice (h)eight\n        f += // accumulate \"volumetric lighting\" into final output\n        \to.y < T.x // loop condition\n        \t\t?\n                    o = d * h / -abs(d.y), // calculate offset of slice intersection\n                    c = o.xz - iTime * .2,\n                    l = T, // terrain sample 1\n                    t = texture(iChannel1,c), // terrain / lava texture sample\n                       //t = textureLod(iChannel1,c, 12. * (T.x-o.y) ), // comment in for better glow\n                    g = pow( l*t,t+7. // glow color\n                                   //+sin(iTime) // comment in for pulse effect\n                                ) * o.y // change color of sky\n\t        \t: g; // should be zero not g but g looks ok\n            \n            \n \tc-=.1; // offset UV for lighting\n    l -= T-.4; // terrain lighting\n    \n    \n    f += // f already contains \"volumetric lighting\"\n         t * l // terrain texture * lighting\n        + g * 6e2 // add glow,\n        \t* o.y // fiddle with sky color some more\n        +o.z*.03; // \"depth fog\"\n    \n    //f = 1. - exp(-f * 1.5); // tonemap    \n}\n\n/*\n// minified..\n\n#define T texture(iChannel0,c*.1)\nvoid mainImage(out vec4 f, vec2 c){vec4 d=vec4(c/iResolution.x,1,1)-.5,o,g,t,l;o=f*=0.;\nfor(float h=0.;h<.6;h+=.001)f+=o.y<T.x?o=d*h/-abs(d.y),c=o.xz-iTime*.1,l=T,\nt=texture(iChannel1,c),g=pow(l*t,t+7.)*o.y:g;c-=.1;l-=T-.4-d.y;f+=t*l+g*2e2+o.z*.03;}\n\n*/\n\n\n/*\n// New and improved - backup\n\n#define T texture(iChannel0,c*.1)\n\nvoid mainImage( out vec4 f, vec2 c )\n{\n    vec4 o = vec4( c / iResolution.x, 1, 1 ) - .5, d=o, g, t, l;\n\t\n    f*=0.;\n    for ( float h=0.; h<.6; h+=.001)\n        if ( o.y < T.x )\n            l = T,\n            t = texture(iChannel1,c -= .1),\n            f -= g = pow( l*t,t+7. \n                       // +sin(iTime)\n                        ) * d.y,\n            l -= T-.2,\n            o = d * h/-abs(d.y),\n            c = o.xz - iTime * .1;\n    \n    \n    f += t * l\n        - g * 3e2\n        +o.z*.01;\n}\n*/\n\n/*\n\n#define T texture(iChannel0,c*.07)\n\nvoid mainImage( out vec4 r, vec2 c )\n{\n    vec4 o = vec4( c / iResolution.x, 1, 1 ) - .5, d=o, g, l, f;\n\n    for ( float h=0.; h<.6 && o.y < T.x; h+=.001)\n\t\tr = T,\n        l = texture(iChannel1,c -= .1),\n        f += g = pow( r*l,l+8.+sin(iTime) ) * o.y, \n        r -= T-.2,\n        o = d * h / -abs(d.y),\n        c = o.xz - iTime * .1;\n    \n    r = l * r\n        + g * 3e2 \n        + f\n        + o.z / 1e2;\n}\n\n*/\n\n/*\n// Move condition into for loop (thanks lherm)\n\n#define T texture(iChannel0,c*.1)\n\nvoid mainImage( out vec4 f, vec2 c )\n{\n    vec3 o = vec3( c / iResolution.x, 1 ) - .5, d=o;\n        \n    for ( float h=0.; h<.6 &&  o.y < T.x; h+=.001)\n        o = d * h / -abs(d.y), // Intersect slice\n        c = o.xz - iTime * .1, // Get terrain UV\n        f = T; // Sample terrain texture    \n    \n    f = 1. -exp( - // tonemap\n          texture(iChannel1,c+=.1)  // texture (and offet uv for lighting)\n        * ( \n              .2 - f + T // terrain lighting - should be max(0., ...\n            - exp( vec4(16, 14, 9, 1) * f - 9. + sin(iTime))  // lava glow\n            * d.y            \n          )\n          \n          -o.z * .01 // \"fog\"\n                \n          //+o.z * f *.1// fog effect 2\n                \n    );    \n}\n*/\n\n/*\n\n#define T texture(iChannel0,c*.1)\n\nvoid mainImage( out vec4 f, vec2 c )\n{\n    vec3 o = vec3( c / iResolution.x, 1 ) - .5, d=o;\n        \n\tf=T;\n    \n    for ( float h=0.; h<.6 &&  o.y < f.x; h+=.001)\n        o = d * h / -abs(d.y), // Intersect slice\n        c = o.xz - iTime * .1, // Get terrain UV\n        f = T; // Sample terrain texture    \n    \n    f = 1. -exp( - // tonemap\n          texture(iChannel1,c+=.1)  // texture (and offet uv for lighting)\n        * ( \n              .2 - f + T // terrain lighting - should be max(0., ...\n            - exp( vec4(16, 14, 9, 1) * f - 9. + sin(iTime))  // lava glow\n            * d.y            \n          )\n          \n          -o.z * .01 // \"fog\"\n                \n          //+o.z * f *.1// fog effect 2\n                \n    );    \n}\n*/\n\n// backup \n\n/*\n\n#define T texture(iChannel0,c*.1)\n\n// lava pulse\n\nvoid mainImage( out vec4 f, vec2 c )\n{\n    vec3 d = vec3( c / iResolution.x, 1 ) - .5, o=d;\n\t    \n    f *= 0.;\n    //d.y *=sign(d.y)+2.; f=iDate;\n    \n    for ( float h=0.; h<.6; h+=.001)\n        if ( o.y < f.x) // break out of loop\n            o = d * h / d.y, // Intersect slice\n            c = o.xz - iTime * .1, // Get terrain UV\n            f = T; // Sample terrain texture    \n    \n    f = 1. -exp( - // tonemap\n          texture(iChannel1,c+=.05)  // texture (and offet uv for lighting)\n        * ( \n              .2 + f.x -T.x // terrain lighting - should be max(0., ...\n            + exp( vec4(16, 13, 9, 1) * f - 9. + sin(iTime)) // lava glow\n          )\n          -o.z * .01 // \"fog\"\n    );    \n}\n*/\n\n/*\n// plane slices version\n\n#define T texture(iChannel0,c*.1)\n\nvoid mainImage( out vec4 f, vec2 c )\n{\n    vec3 d = vec3( c / iResolution.x, 1 ) - .5, o=d;\n\n    f = vec4(0);\n    for ( float h=0.; h<.6; h+=.001)\n        if ( o.y < f.x) // break out of loop\n            o = d * h / d.y, // Intersect slice\n            c = o.xz - iTime * .1, // Get terrain UV\n            f = T; // Sample terrain texture\n    \n    \n    f = 1. -exp( - // tonemap\n          texture(iChannel1,c+=.05)  // texture (and offet uv for lighting)\n        * ( \n              max(0., .2 + f.x -T.x) // terrain lighting\n            + exp( vec4(16, 13, 9, 1) * f - 9.) // lava glow\n          )\n          -o.z * .01 // \"fog\"\n        //+ dot(o,o) * .001// \"fog\"\n    );    \n}\n*/\n\n\n// first version @ 279\n\n/*\n#define T texture(iChannel0,c*.1)\n\nvoid mainImage( out vec4 f, vec2 c )\n{\n    vec3 d = vec3( c / iResolution.x, 1 ) - .5, o = d /= 2e2;\n    \n    do\n\t\to += d, // Step along ray\n        c = o.xz + iTime * .1, // Get terrain UV\n        f = T; // Sample terrain texture\n    while(\n        o.z < 8. && // far clip\n        o.y > -min(.6,f.x)); // hit terrain\n\n    f = 1. -exp( - // tonemap\n          texture(iChannel1,c+=.05)  // texture\n        * ( \n              max(0., .2 + f.x -T.x) // terrain lighting\n            + exp( vec4(16, 13, 9, 1) * f.x - 9.) // lava glow\n          )\n        * step(o.z, 8.) // far clip\n        + o.z * .03 // \"fog\"\n    );    \n}\n\n*/\n\n\n\n\n/*\n//hacks\n\n#define T texture(iChannel0,c*.1)\n\n// lava pulse\n\nvoid mainImage( out vec4 f, vec2 c )\n{\n    vec4 o = vec4( c / iResolution.x, 1, 0 ) - .5, d=o/1e3/o.y;\n    \n    o=f=o-o;\n    for(int i=0;i<600;i++)\n        if ( o.y <= f.x) // break out of loop\n            o += d, // Intersect slice\n            c = o.xz - iTime * .1, // Get terrain UV\n            f = T; // Sample terrain texture    \n    \n    f = 1. -exp( - // tonemap\n          texture(iChannel1,c+=.05)  // texture (and offet uv for lighting)\n        * ( \n              .2 + f -T // terrain lighting - should be max(0., ...\n            + exp( vec4(16, 13, 9, 1) * f - 9. + sin(iTime)) // lava glow\n          )\n          -o.z * .01 // \"fog\"\n    );    \n}\n\n*/",
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
          "mFlagMusicStream": true
        },
        "info": {
          "id": "ldBfDR",
          "date": "1500040573",
          "viewed": 25740,
          "name": "[SH17A] Lava Planet",
          "username": "P_Malin",
          "description": "280 character entry for Round 1 of the 2017 Shadertoy competition https://www.shadertoy.com/events/competition\n\nThere was more potential in this code so I made a variation without the 280 character limit here: https://www.shadertoy.com/view/4dBBDD",
          "likes": 91,
          "published": 3,
          "flags": 64,
          "usePreview": 0,
          "tags": [
            "terrain",
            "lava",
            "2tweets",
            "2tweet",
            "sh17a"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);
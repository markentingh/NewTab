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
            "code": "// The MIT License\n// Copyright © 2013 Inigo Quilez\n// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the \"Software\"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n// https://www.youtube.com/c/InigoQuilez\n// https://iquilezles.org\n\n\n// List of ray-surface intersectors at https://www.shadertoy.com/playlist/l3dXRf\n//\n// and https://iquilezles.org/articles/intersectors\n\n\n#if 1\n//\n// Elegant way to intersect a planar coordinate system (3x3 linear system)\n//\nvec3 intersectCoordSys( in vec3 ro, in vec3 rd, vec3 dc, vec3 du, vec3 dv )\n{\n\tvec3 oc = ro - dc;\n\treturn vec3(\n        dot( cross(du,dv), oc ),\n\t\tdot( cross(oc,du), rd ),\n\t\tdot( cross(dv,oc), rd ) ) / \n        dot( cross(dv,du), rd );\n}\n\n#else\n//\n// Ugly (but faster) way to intersect a planar coordinate system: plane + projection\n//\nvec3 intersectCoordSys( in vec3 ro, in vec3 rd, vec3 dc, vec3 du, vec3 dv )\n{\n\tvec3  oc = ro - dc;\n\tvec3  no = cross(du,dv);\n    float t  = -dot(no,oc)/dot(rd,no);\n    float r  =  dot(du,oc + rd*t);\n    float s  =  dot(dv,oc + rd*t);\n    return vec3(t,s,r);\n}\n\n#endif\t\n\nvec3 hash3( float n )\n{\n    return fract(sin(vec3(n,n+1.0,n+2.0))*vec3(43758.5453123,12578.1459123,19642.3490423));\n}\n\nvec3 shade( in vec4 res )\n{\n    float ra = length(res.yz);\n    float an = atan(res.y,res.z) + 2.0*iTime;\n    float pa = sin(3.0*an);\n\n    vec3 cola = 0.5 + 0.5*sin( (res.w/32.0)*3.5 + vec3(0.0,1.0,2.0) );\n\t\n\tvec3 col = vec3(0.0);\n\tcol += cola*0.4*(1.0-smoothstep( 0.90, 1.00, ra) );\n    col += cola*1.0*(1.0-smoothstep( 0.00, 0.03, abs(ra-0.8)))*(0.5+0.5*pa);\n    col += cola*1.0*(1.0-smoothstep( 0.00, 0.20, abs(ra-0.8)))*(0.5+0.5*pa);\n\tcol += cola*0.5*(1.0-smoothstep( 0.05, 0.10, abs(ra-0.5)))*(0.5+0.5*pa);\n    col += cola*0.7*(1.0-smoothstep( 0.00, 0.30, abs(ra-0.5)))*(0.5+0.5*pa);\n\n\treturn col*0.3;\n}\n\nvec3 render( in vec3 ro, in vec3 rd )\n{\n  \t// raytrace\n    vec3 col = vec3( 0.0 );\n\tfor( int i=0; i<32; i++ )\n\t{\n\t\t// position disk\n\t    vec3 r = 1.5*(-1.0 + 2.0*hash3( float(i) ));\n\t\t\n        // orientate disk\n\t\tvec3 u = normalize( r.zxy );\n        vec3 v = normalize( cross( u, vec3(0.0,1.0,0.0 ) ) );\t\t\t\t\t\t   \n\t\t\n        // intersect coord sys\n        vec3 tmp = intersectCoordSys( ro, rd, r, u, v );\n\t\n\t    if( dot(tmp.yz,tmp.yz)<1.0 && tmp.x>0.0 ) \n\t    {\n            // shade\t\t\t\n\t\t    col += shade( vec4(tmp,float(i)) );\n\t    }\n\t}\n\n    return col;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 p = (2.0*fragCoord-iResolution.xy)/iResolution.y;\n\n    // camera\n\tvec3 ro = 1.5*vec3(cos(0.05*iTime),0.0,sin(0.05*iTime));\n    vec3 ta = vec3(0.0,0.0,0.0);\n    // camera matrix\n    vec3 ww = normalize( ta - ro );\n    vec3 uu = normalize( cross(ww,vec3(0.0,1.0,0.0) ) );\n    vec3 vv = normalize( cross(uu,ww));\n\t// create view ray\n\tvec3 rd = normalize( p.x*uu + p.y*vv + 1.0*ww );\n\n    vec3 col = render( ro, rd );\n    \n    fragColor = vec4( col, 1.0 );\n}\n",
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
          "id": "lsfGDB",
          "date": "1378277216",
          "viewed": 23837,
          "name": "CoordSys - intersection",
          "username": "iq",
          "description": "Spinning disks",
          "likes": 143,
          "published": 3,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "3d",
            "raytracing",
            "intersection",
            "disk"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);
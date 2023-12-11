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
              },
              {
                "channel": 2,
                "type": "buffer",
                "id": "4sXGR8",
                "filepath": "/media/previz/buffer02.png",
                "sampler": {
                  "filter": "linear",
                  "wrap": "clamp",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              },
              {
                "channel": 3,
                "type": "buffer",
                "id": "XdfGR8",
                "filepath": "/media/previz/buffer03.png",
                "sampler": {
                  "filter": "linear",
                  "wrap": "clamp",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// bloom from https://www.shadertoy.com/view/lstSRS\n\nvec4 cubic(float x)\n{\n    float x2 = x * x;\n    float x3 = x2 * x;\n    vec4 w;\n    w.x =   -x3 + 3.0*x2 - 3.0*x + 1.0;\n    w.y =  3.0*x3 - 6.0*x2       + 4.0;\n    w.z = -3.0*x3 + 3.0*x2 + 3.0*x + 1.0;\n    w.w =  x3;\n    return w / 6.0;\n}\n\nvec4 BicubicTexture(in sampler2D tex, in vec2 coord)\n{\n\tvec2 resolution = iResolution.xy;\n\n\tcoord *= resolution;\n\n\tfloat fx = fract(coord.x);\n    float fy = fract(coord.y);\n    coord.x -= fx;\n    coord.y -= fy;\n\n    fx -= 0.5;\n    fy -= 0.5;\n\n    vec4 xcubic = cubic(fx);\n    vec4 ycubic = cubic(fy);\n\n    vec4 c = vec4(coord.x - 0.5, coord.x + 1.5, coord.y - 0.5, coord.y + 1.5);\n    vec4 s = vec4(xcubic.x + xcubic.y, xcubic.z + xcubic.w, ycubic.x + ycubic.y, ycubic.z + ycubic.w);\n    vec4 offset = c + vec4(xcubic.y, xcubic.w, ycubic.y, ycubic.w) / s;\n\n    vec4 sample0 = texture(tex, vec2(offset.x, offset.z) / resolution);\n    vec4 sample1 = texture(tex, vec2(offset.y, offset.z) / resolution);\n    vec4 sample2 = texture(tex, vec2(offset.x, offset.w) / resolution);\n    vec4 sample3 = texture(tex, vec2(offset.y, offset.w) / resolution);\n\n    float sx = s.x / (s.x + s.y);\n    float sy = s.z / (s.z + s.w);\n\n    return mix( mix(sample3, sample2, sx), mix(sample1, sample0, sx), sy);\n}\n\nvec3 ColorFetch(vec2 coord)\n{\n \treturn texture(iChannel0, coord).rgb;   \n}\n\nvec3 BloomFetch(vec2 coord)\n{\n \treturn BicubicTexture(iChannel3, coord).rgb;   \n}\n\nvec3 Grab(vec2 coord, const float octave, const vec2 offset)\n{\n \tfloat scale = exp2(octave);\n    \n    coord /= scale;\n    coord -= offset;\n\n    return BloomFetch(coord);\n}\n\nvec2 CalcOffset(float octave)\n{\n    vec2 offset = vec2(0.0);\n    \n    vec2 padding = vec2(10.0) / iResolution.xy;\n    \n    offset.x = -min(1.0, floor(octave / 3.0)) * (0.25 + padding.x);\n    \n    offset.y = -(1.0 - (1.0 / exp2(octave))) - padding.y * octave;\n\n\toffset.y += min(1.0, floor(octave / 3.0)) * 0.35;\n    \n \treturn offset;   \n}\n\nvec3 GetBloom(vec2 coord)\n{\n \tvec3 bloom = vec3(0.0);\n    \n    //Reconstruct bloom from multiple blurred images\n    bloom += Grab(coord, 1.0, vec2(CalcOffset(0.0))) * 1.0;\n    bloom += Grab(coord, 2.0, vec2(CalcOffset(1.0))) * 1.5;\n\tbloom += Grab(coord, 3.0, vec2(CalcOffset(2.0))) * 1.0;\n    bloom += Grab(coord, 4.0, vec2(CalcOffset(3.0))) * 1.5;\n    bloom += Grab(coord, 5.0, vec2(CalcOffset(4.0))) * 1.8;\n    bloom += Grab(coord, 6.0, vec2(CalcOffset(5.0))) * 1.0;\n    bloom += Grab(coord, 7.0, vec2(CalcOffset(6.0))) * 1.0;\n    bloom += Grab(coord, 8.0, vec2(CalcOffset(7.0))) * 1.0;\n\n\treturn bloom;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    \n    vec2 uv = fragCoord.xy / iResolution.xy;\n    \n    vec3 color = ColorFetch(uv);\n    \n    \n    color += GetBloom(uv) * 0.12;\n    \n    color *= 2.0;\n    \n\n    //Tonemapping and color grading\n    color = pow(color, vec3(1.5));\n    color = color / (1.0 + color);\n    color = pow(color, vec3(1.0 / 1.5));\n\n    \n    color = mix(color, color * color * (3.0 - 2.0 * color), vec3(1.0));\n    color = pow(color, vec3(1.3, 1.20, 1.0));    \n\n\tcolor = saturate(color * 1.01);\n    \n    color = pow(color, vec3(0.7 / 2.2));\n\n    fragColor = vec4(color, 1.0);\n   // fragColor = texture(iChannel1, uv) * 10111.;\n\n}\n",
            "name": "Image",
            "description": "",
            "type": "image"
          },
          {
            "outputs": [],
            "inputs": [],
            "code": "vec3 HUEtoRGB(in float hue)\n{\n    vec3 rgb = abs(hue * 6. - vec3(3, 2, 4)) * vec3(1, -1, -1) + vec3(-1, 2, 2);\n    return clamp(rgb, 0., 1.);\n}\nvec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )\n{\n    return a + b*cos( 6.28318*(c*t+d) );\n}\nvec3 saturate(vec3 x)\n{\n    return clamp(x, vec3(0.0), vec3(1.0));\n}\nvec3 firePalette(float i){\n\n    float T = 1400. + 1300.*i; // Temperature range (in Kelvin).\n    vec3 L = vec3(7.4, 5.6, 4.4); // Red, green, blue wavelengths (in hundreds of nanometers).\n    L = pow(L,vec3(5)) * (exp(1.43876719683e5/(T*L)) - 1.);\n    return 1. - exp(-5e8/L); // Exposure level. Set to \"50.\" For \"70,\" change the \"5\" to a \"7,\" etc.\n}\n// Smooth minimum function. Hardcoded with the smoothing value \"0.25.\"\nfloat sminP(in float a, in float b , float s){\n    \n    float h = clamp(2.*(b - a) + 0.5, 0.0, 1.0);\n    return (b - s*h)*(1. - h) + a*h;\n    \n}\nfloat smin0( float a, float b, float k )\n{\n\tfloat h = clamp( 0.5 + 0.5*(b-a)/k, 0.0, 1.0 );\n\treturn mix( b, a, h ) - k*h*(1.0-h);\n}\n\nvec3 sphericalToCartesian(vec3 p) {\n    return vec3(p.x * sin(p.y) * cos(p.z),\n                p.x * sin(p.y) * sin(p.z),\n                p.x * cos(p.y));\n}\n\nvec3 cartestianToSpherical(vec3 p) {\n    float d = length(p);\n    return vec3 ( d, acos(p.z / d), sign(p.y) * acos(p.x / length(p.xy)) );\n}\n\nmat2 rotate2d(float _angle){\n    return mat2(cos(_angle),-sin(_angle),\n                sin(_angle),cos(_angle));\n}\nfloat hash11( float n )\n{\n    return fract(sin(n)*43758.5453);\n}\nvec2 hash22( vec2 p )\n{\n    //p = mod(p, 4.0); // tile\n    p = vec2(dot(p,vec2(175.1,311.7)),\n             dot(p,vec2(260.5,752.3)));\n    return fract(sin(p+455.)*18.5453);\n}\n\nvec3 hash13(float n) {\n    float n1 = n;\n    float n2 = hash11(n);\n    float n3 = hash11(n2);\n    return vec3(hash11(n1),hash11(n2),hash11(n3));\n}\nfloat sdPlane( vec3 p )\n{\n\treturn p.y;\n}\n\nfloat sdSphere( vec3 p, float s )\n{\n    return length(p)-s;\n}\n\nfloat sdBox( vec3 p, vec3 b )\n{\n    vec3 d = abs(p) - b;\n    return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));\n}\n\nfloat sdEllipsoid( in vec3 p, in vec3 r )\n{\n    float k0 = length(p/r);\n    float k1 = length(p/(r*r));\n    return k0*(k0-1.0)/k1;\n    \n}\n\nfloat sdRoundBox( in vec3 p, in vec3 b, in float r ) \n{\n    vec3 q = abs(p) - b;\n    return min(max(q.x,max(q.y,q.z)),0.0) + length(max(q,0.0)) - r;\n}\n\nfloat sdTorus( vec3 p, vec2 t )\n{\n    return length( vec2(length(p.xz)-t.x,p.y) )-t.y;\n}\n\nfloat sdHexPrism( vec3 p, vec2 h )\n{\n    vec3 q = abs(p);\n\n    const vec3 k = vec3(-0.8660254, 0.5, 0.57735);\n    p = abs(p);\n    p.xy -= 2.0*min(dot(k.xy, p.xy), 0.0)*k.xy;\n    vec2 d = vec2(\n       length(p.xy - vec2(clamp(p.x, -k.z*h.x, k.z*h.x), h.x))*sign(p.y - h.x),\n       p.z-h.y );\n    return min(max(d.x,d.y),0.0) + length(max(d,0.0));\n}\n\nfloat sdCapsule( vec3 p, vec3 a, vec3 b, float r )\n{\n\tvec3 pa = p-a, ba = b-a;\n\tfloat h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );\n\treturn length( pa - ba*h ) - r;\n}\n\nfloat sdRoundCone( in vec3 p, in float r1, float r2, float h )\n{\n    vec2 q = vec2( length(p.xz), p.y );\n    \n    float b = (r1-r2)/h;\n    float a = sqrt(1.0-b*b);\n    float k = dot(q,vec2(-b,a));\n    \n    if( k < 0.0 ) return length(q) - r1;\n    if( k > a*h ) return length(q-vec2(0.0,h)) - r2;\n        \n    return dot(q, vec2(a,b) ) - r1;\n}\n\nfloat dot2(in vec3 v ) {return dot(v,v);}\nfloat sdRoundCone(vec3 p, vec3 a, vec3 b, float r1, float r2)\n{\n    // sampling independent computations (only depend on shape)\n    vec3  ba = b - a;\n    float l2 = dot(ba,ba);\n    float rr = r1 - r2;\n    float a2 = l2 - rr*rr;\n    float il2 = 1.0/l2;\n    \n    // sampling dependant computations\n    vec3 pa = p - a;\n    float y = dot(pa,ba);\n    float z = y - l2;\n    float x2 = dot2( pa*l2 - ba*y );\n    float y2 = y*y*l2;\n    float z2 = z*z*l2;\n\n    // single square root!\n    float k = sign(rr)*rr*rr*x2;\n    if( sign(z)*a2*z2 > k ) return  sqrt(x2 + z2)        *il2 - r2;\n    if( sign(y)*a2*y2 < k ) return  sqrt(x2 + y2)        *il2 - r1;\n                            return (sqrt(x2*a2*il2)+y*rr)*il2 - r1;\n}\n\nfloat sdEquilateralTriangle(  in vec2 p )\n{\n    const float k = 1.73205;//sqrt(3.0);\n    p.x = abs(p.x) - 1.0;\n    p.y = p.y + 1.0/k;\n    if( p.x + k*p.y > 0.0 ) p = vec2( p.x - k*p.y, -k*p.x - p.y )/2.0;\n    p.x += 2.0 - 2.0*clamp( (p.x+2.0)/2.0, 0.0, 1.0 );\n    return -length(p)*sign(p.y);\n}\n\nfloat sdTriPrism( vec3 p, vec2 h )\n{\n    vec3 q = abs(p);\n    float d1 = q.z-h.y;\n    h.x *= 0.866025;\n    float d2 = sdEquilateralTriangle(p.xy/h.x)*h.x;\n    return length(max(vec2(d1,d2),0.0)) + min(max(d1,d2), 0.);\n}\n\n// vertical\nfloat sdCylinder( vec3 p, vec2 h )\n{\n    vec2 d = abs(vec2(length(p.xz),p.y)) - h;\n    return min(max(d.x,d.y),0.0) + length(max(d,0.0));\n}\n\n// arbitrary orientation\nfloat sdCylinder(vec3 p, vec3 a, vec3 b, float r)\n{\n    vec3 pa = p - a;\n    vec3 ba = b - a;\n    float baba = dot(ba,ba);\n    float paba = dot(pa,ba);\n\n    float x = length(pa*baba-ba*paba) - r*baba;\n    float y = abs(paba-baba*0.5)-baba*0.5;\n    float x2 = x*x;\n    float y2 = y*y*baba;\n    float d = (max(x,y)<0.0)?-min(x2,y2):(((x>0.0)?x2:0.0)+((y>0.0)?y2:0.0));\n    return sign(d)*sqrt(abs(d))/baba;\n}\n\nfloat sdCone( in vec3 p, in vec3 c )\n{\n    vec2 q = vec2( length(p.xz), p.y );\n    float d1 = -q.y-c.z;\n    float d2 = max( dot(q,c.xy), q.y);\n    return length(max(vec2(d1,d2),0.0)) + min(max(d1,d2), 0.);\n}\n\nfloat dot2( in vec2 v ) { return dot(v,v); }\nfloat sdCappedCone( in vec3 p, in float h, in float r1, in float r2 )\n{\n    vec2 q = vec2( length(p.xz), p.y );\n    \n    vec2 k1 = vec2(r2,h);\n    vec2 k2 = vec2(r2-r1,2.0*h);\n    vec2 ca = vec2(q.x-min(q.x,(q.y < 0.0)?r1:r2), abs(q.y)-h);\n    vec2 cb = q - k1 + k2*clamp( dot(k1-q,k2)/dot2(k2), 0.0, 1.0 );\n    float s = (cb.x < 0.0 && ca.y < 0.0) ? -1.0 : 1.0;\n    return s*sqrt( min(dot2(ca),dot2(cb)) );\n}\n\n#if 0\n// bound, not exact\nfloat sdOctahedron(vec3 p, float s ) \n{\n    p = abs(p);\n    return (p.x + p.y + p.z - s)*0.57735027;\n}\n#else\n// exacy distance\nfloat sdOctahedron(vec3 p, float s)\n{\n    p = abs(p);\n    \n    float m = p.x + p.y + p.z - s;\n    \n\tvec3 q;\n         if( 3.0*p.x < m ) q = p.xyz;\n    else if( 3.0*p.y < m ) q = p.yzx;\n    else if( 3.0*p.z < m ) q = p.zxy;\n    else return m*0.57735027;\n    \n    float k = clamp(0.5*(q.z-q.y+s),0.0,s); \n    return length(vec3(q.x,q.y-s+k,q.z-k)); \n}\n#endif\n\n\nfloat length2( vec2 p )\n{\n\treturn sqrt( p.x*p.x + p.y*p.y );\n}\n\nfloat length6( vec2 p )\n{\n\tp = p*p*p; p = p*p;\n\treturn pow( p.x + p.y, 1.0/6.0 );\n}\n\nfloat length8( vec2 p )\n{\n\tp = p*p; p = p*p; p = p*p;\n\treturn pow( p.x + p.y, 1.0/8.0 );\n}\n\nfloat sdTorus82( vec3 p, vec2 t )\n{\n    vec2 q = vec2(length2(p.xz)-t.x,p.y);\n    return length8(q)-t.y;\n}\n\nfloat sdTorus88( vec3 p, vec2 t )\n{\n    vec2 q = vec2(length8(p.xz)-t.x,p.y);\n    return length8(q)-t.y;\n}\n\nfloat sdCylinder6( vec3 p, vec2 h )\n{\n    return max( length6(p.xz)-h.x, abs(p.y)-h.y );\n}\n\n//------------------------------------------------------------------\n\nfloat opS( float d1, float d2 )\n{\n    return max(-d2,d1);\n}\n\nvec2 opU( vec2 d1, vec2 d2 )\n{\n\treturn (d1.x<d2.x) ? d1 : d2;\n}\n\nvec3 opRep( vec3 p, vec3 c )\n{\n    return mod(p,c)-0.5*c;\n}\n\nvec3 opTwist( vec3 p )\n{\n    float  c = cos(10.0*p.y+10.0);\n    float  s = sin(10.0*p.y+10.0);\n    mat2   m = mat2(c,-s,s,c);\n    return vec3(m*p.xz,p.y);\n}",
            "name": "Common",
            "description": "",
            "type": "common"
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
                "id": "XdfGRn",
                "filepath": "/media/a/e6e5631ce1237ae4c05b3563eda686400a401df4548d0f9fad40ecac1659c46c.jpg",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "#define AA 1   // make this 2 or 3 for antialiasing\n\n\n\n//------------------------------------------------------------------\n\n#define ZERO (min(iFrame,0))\n\n//------------------------------------------------------------------\n\n// play with thoses\nint sym = 1;\nint iqheart = 0;\nint megamod = 0;\n\nfloat yuid = 0.;\nfloat sdTunnelDepth(in vec3 p, out vec3 matData, float time, float tid) {\nvec3 l = p;\n//p.y+=cos(p.x * 4.) / 4.;\nfloat ty = 5.5;\np.z = mod(p.z + time*-18., ty)-ty/2.;\nif (sym ==1) {\np.xz = -abs(p.xz);\np.xy *= rotate2d(iTime);\np.xz = -abs(p.xz);\n\np.xy *= rotate2d(iTime / 4. + 12.);\np.xz = -abs(p.xz);\np.xy *= rotate2d(iTime / 8. + 3.);\np.xz = -abs(p.xz);\n\np.xy *= rotate2d(iTime/ -3. + 4.);\np.xz = -abs(p.xz);\np.xy *= rotate2d(iTime / - 7. + 5.);\np.xz = -abs(p.xz);\n}\n//p.zyx*=2.;\nfloat b =.0;\n    p.xy *= rotate2d(p.z/ 1.5)/1.;\n \n    p.xy*=rotate2d(time * 2.);\n    float r = 4.;//+sin(iTime) ;\n    p = cartestianToSpherical(p);\n   // p.z *= 6.+sin(time) * 5.;\n   float a = p.z;\n    p.z *= 3.;p.z+=time * -12.;\n    \n        p = sphericalToCartesian(p);\n        if (megamod==1)\n    p= mod(p, r) - r/2.;\n   // p.xyz = abs(p.xyz);\n    //p.x = abs(p.x);\n    p.z+=time * -6.;\n//    p.xy *= rotate2d(p.z/ 3.5 + time);\n    // global transformation\n  //  float u = 3.+cos(iTime / 120.) * 3., v = 2.*sin(iTime);\n    float u = 3.;\n    float v = 1.;\n    if (tid==0.){\n    p.x += sin(p.z*6. * u) / 11.+sin(p.z/11. + 1.7) / 2. * v;\n    p.y += cos(p.z*1. * u + time*3.) / 2. * v;\n    p.y += sin(p.z*2.  * u+ cos(time*6.)*2.) / 4. * v;\n   // p.xy *= rotate2d(time * 2.);\n     p.x += cos(p.z*.5 * u) / 24. * v;\n      //p.z += cos(iTime) * 2. * v;\n\n     }\n     \n    vec3 p1 = p;\n    vec3 p2 = p;\n \n    // spherical space\n    vec3 ps = cartestianToSpherical(p1);\n    float id = floor(ps.z / .2245);\n    matData.x = ps.z/2.+p.z/2. + time / .1;\n    if (tid==0.)\n    matData.x += 1.;\n//    matData.x = (ps.z+a)*.1+time/2.;//1.*( (ps.z + a)/13. +  p.z*0. + iTime*0.);//(ps.z + a) / 12. + iTime / 4. + p.z * 2.*sin(time / -25.);//3.;//id / .32;\n   // ps.z *=1.5 + sin(iTime)/2.;\n   \n   ps.z*=2.;\n   \n    //matData.y = mod(ps.z + time*100., 12.) - 6. ;\n    ps.z = mod(ps.z, .2245) -1.7;    \n    \n    p1 = sphericalToCartesian(ps);\n    matData.y = id;\n    p1.y+=1.5;\n    //if (mod(floor( (sin(iTime/ 12.) * 32.)),2.) == 0.)\n      // return length(p1.xy) - .05;\n    // Per cylinder transformation\n   // p1.xy *= rotate2d(id + time);\n   vec3 p4 = p1;\n    p1.x += cos(p.z*3.5 * hash11(id / 32.) * 21.14) / 12.;\n \n     p1.y+=cos(p.z * 2.* hash11(id / 12.)) / 5.;\n     float rep = .051;\n     p.z+=sin(p.x * 1.) / 2.5;\n    p.z+=time*-1.;\n    \n    p.z = mod(p.z, rep) - rep/2.;   \n    \n    float tdist = sdTorus(p.xzy, vec2(1.5,.0005));\n  //  return tdist;\n  \n  vec3 pp = p2;\n  r = .92;\n  pp.xy*=rotate2d(time * -12.);\n  pp.x-=11.5;\n  \n  pp = mod(pp, r) - r/2.;\n    float  ppdist = length(pp) - .02;\n    return min( min(length(p1.xy) - .05 /*+ sin(iTime) /10.*/, tdist), ppdist);\n\n}\n\nfloat sdTunnel(in vec3 p, out vec3 matData) {\n\n    float time = iTime / 2.;\n    float d1 =  sdTunnelDepth(p, matData, -time/ 6. + yuid*330.1123, 0.);\n    \n    return d1;\n    float d2 =  sdTunnelDepth(p * vec3(.4, .4, .5), matData, time / 7. + 1., 1.);\n     matData.z = 1.;\n   //  if (mod(floor( (sin(iTime/ 2.) * 32.)),2.) == 0.)\n     return d1;\n     //return d2;\n     if (d1<d2)\n     matData.z = 1.;\n    // if (sin(iTime) < -.3)\n    ;// d1=d2;\n    return min(d2,d1);\n}\n\nvec2 map( in vec3 pos , out vec3 matData)\n{\n    vec2 res = vec2( 1e10, 0.0 );\n    float d = 0.;\n     vec3 matData_tmp;\n     if ((d = sdTunnel(pos, matData_tmp)) < res.x) {\n        res.x = d;\n        res.y = 1.;\n        matData=matData_tmp;\n    }\n    \n    return res;\n}\n\nconst float maxHei = 0.8;\n\nvec2 castRay( in vec3 ro, in vec3 rd, out vec3 matData)\n{\n    vec2 res = vec2(-1.0,-1.0);\n\n    float tmin = .11;\n    float tmax = 30.0;\n\n    // raymarch primitives   \n    {\n    \n        float t = tmin;\n        for( int i=0; i<150 && t<tmax; i++ )\n        {\n            vec2 h = map( ro+rd*t, matData );\n            if( abs(h.x)<(0.01*t) )\n            { \n                res = vec2(t,h.y); \n                 break;\n            }\n            t += h.x * .3;\n        }\n    }\n    \n    return res;\n}\n\n// https://iquilezles.org/articles/normalsSDF\nvec3 calcNormal( in vec3 pos )\n{\n    vec3 t;\n    vec2 e = vec2(1.0,-1.0)*0.5773*0.0005;\n    return normalize( e.xyy*map( pos + e.xyy,t ).x + \n\t\t\t\t\t  e.yyx*map( pos + e.yyx,t ).x + \n\t\t\t\t\t  e.yxy*map( pos + e.yxy,t ).x + \n\t\t\t\t\t  e.xxx*map( pos + e.xxx,t ).x );\n \n}\n\nfloat calcAO( in vec3 pos, in vec3 nor )\n{\n\tfloat occ = 0.0;\n    float sca = 1.0;\n    vec3 t;\n    for( int i=ZERO; i<5; i++ )\n    {\n        float hr = 0.01 + 0.12*float(i)/4.0;\n        vec3 aopos =  nor * hr + pos;\n        float dd = map( aopos,t ).x;\n        occ += -(dd-hr)*sca;\n        sca *= 0.95;\n    }\n    return clamp( 1.0 - 3.0*occ, 0.0, 1.0 ) * (0.5+0.5*nor.y);\n}\n\n\nmat3 setCamera( in vec3 ro, in vec3 ta, float cr )\n{\n\tvec3 cw = normalize(ta-ro);\n\tvec3 cp = vec3(sin(cr), cos(cr),0.0);\n\tvec3 cu = normalize( cross(cw,cp) );\n\tvec3 cv =          ( cross(cu,cw) );\n    return mat3( cu, cv, cw );\n}\n\nvec3 getcol(float x1) {\n\nfloat x2= mod(iTime / 3. + yuid * 4., 7.) + 0.;\nfloat x = fract(x1 / 1.);\n//x2=0.;\n    vec3 cols[7] = vec3[7] (pal( x, vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,1.0,1.0),vec3(0.0,0.33,0.67) ),\n    pal( x, vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,1.0,1.0),vec3(0.0,0.10,0.20) ),\n    pal( x, vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,1.0,1.0),vec3(0.3,0.20,0.20) ),\n    pal( x, vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,1.0,0.5),vec3(0.8,0.90,0.30) ),\n    pal( x, vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,0.7,0.4),vec3(0.0,0.15,0.20) ),\n    pal( x, vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(2.0,1.0,0.0),vec3(0.5,0.20,0.25) ),\n    pal( x, vec3(0.8,0.5,0.4),vec3(0.2,0.4,0.2),vec3(2.0,1.0,1.0),vec3(0.0,0.25,0.25) )\n    );\n    return mix( cols[int(x2)], cols[int(mod(x2, 7.)) + 1] , fract(x2));\n}\n\nvec3 render( in vec3 ro, in vec3 rd,vec2 uv )\n{ \n    vec3 col = vec3(.0f);\n    \n    vec3 matData;\n    vec2 res = castRay(ro,rd, matData);\n    float t = res.x;\n\tfloat m = res.y;\n    //  vec3 albedo = hash13(matData.x);\n    float i = matData.x;\n    vec3 nor = calcNormal(ro + rd * res.x);\n    float ao = calcAO(ro+rd*res.x, nor);\n   // vec3 albedo = pal( i, vec3(0.5,.5,0.5),vec3(.5,0.5,0.501),vec3(1.0,1.0,1.0),vec3(0.3,0.20,0.20) );\n    vec3 albedo = getcol(i);\n    \n  float idL = floor(mod(iTime, 14.));\n    if (res.x > .0f) {\n    \tcol = vec3(0.) + albedo* vec3(.9f, .5f, .5f) * max(.1f, dot(normalize((ro+ t * rd) - normalize(vec3(100.0f, 1000.0f, 100.0f))), \n             nor) );\n        col *= exp(res.x*-.1);   \n\n        //col *= 1.+15. * smoothstep(.1, .0,abs(matData.y - 1.));\n       \n       if (int(matData.y) % 22 == 0)\n            col *= 5. + 10.*float(sym);\n        else if (int(matData.y) % 8 == 0)\n            col *= 2. + 5.*float(sym);\n            \n     } else {\n        col = .3*pow(texture(iChannel0, uv/1. + vec2(iTime / 16., 0.)).xyz, vec3(5.)).xyz;\n     }\n    return col * (1.+ smoothstep(.1, .05, length(uv)) * 20. * float(sym==1));//*ao *ao*4.;\n   \treturn vec3(col*abs(nor));\n}\n\n\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 mo = vec2(0);//iMouse.xy/iResolution.xy;\n\tfloat time = .0f; //iTime;\n\n    // camera\t\n    vec3 ro = vec3(.0f, .0f, -4.0f);//vec3( 4.6*cos(0.1*time + 6.0*mo.x), 1.0 + 2.0*mo.y, 0.5 + 4.6*sin(0.1*time + 6.0*mo.x) );\n    vec3 ta = vec3( -0.5, -0.4, 0.5 );\n    // camera-to-world transformation\n    mat3 ca = setCamera( ro, ta, 0.0 );\n\n   \n    vec2 p = (-iResolution.xy + 2.0*fragCoord)/iResolution.y;\n\nif (iqheart == 1) {\nfloat rr = 2.;\n//p.y-=iTime * 2.;\nvec2 ids;\np.y += -iTime * 2. + float(p.x>0.);\n ids = hash22(floor(p / rr));\nyuid= ids.x;\n\np = mod(p, rr) - rr/2.;\n}\n    // ray direction\n    vec3 rd = normalize( vec3(p.xy,.5) );\n\n    // render\t\n    vec3 col = render( ro, rd, p.xy );\n\n    // gamma\n   col = pow( col, vec3(1.2545) );\n   //  col = pow( col, vec3(.809545) );\n    \n    fragColor = vec4( saturate(col), 1.0 );\n    \n    //\tp = (2.0*fragCoord-iResolution.xy)/min(iResolution.y,iResolution.x)/1.5;\n\t\n    // background color\n    vec3 bcol = vec3(1.0,0.8,0.7-0.07*p.y)*(1.0-0.25*length(p));\n\n    // animate\n    float tt = mod(iTime,1.5)/1.5;\n    float ss = pow(tt,.2)*0.5 + 0.5;\n    ss = 1.0 + ss*0.5*sin(tt*6.2831*3.0 + p.y*0.5)*exp(-tt*4.0);\n    p *= vec2(0.5,1.5) + ss*vec2(0.5,-0.5);\n\n    // shape\n\tp.y -= 0.25;\n    float a = atan(p.x,p.y)/3.141593;\n    float r = length(p);\n    float h = abs(a);\n    float d = (13.0*h - 22.0*h*h + 10.0*h*h*h)/(6.0-5.0*h);\n    \n\t// color\n\tfloat s = 0.75 + 0.75*p.x;\n\ts *= 1.0-0.4*r;\n\ts = 0.3 + 0.7*s;\n\ts *= 0.5+0.5*pow( 1.0-clamp(r/d, 0.0, 1.0 ), 0.1 );\n\tvec3 hcol = vec3(2,0.2*r,0.3) / 15. * s / .5;\n\t\n//     col = mix( col, hcol, smoothstep( -0.01, 0.01, d-r) );\nif(iqheart==1)\n    col = mix(hcol / 4.,col,min(1., max(0.0,5.*(d-r ))));\n    fragColor = vec4(saturate(col),.0);\n}",
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
              }
            ],
            "code": "//First bloom pass, mipmap tree thing\n\nvec3 ColorFetch(vec2 coord)\n{\n \treturn texture(iChannel0, coord).rgb;   \n}\n\nvec3 Grab1(vec2 coord, const float octave, const vec2 offset)\n{\n \tfloat scale = exp2(octave);\n    \n    coord += offset;\n    coord *= scale;\n\n   \tif (coord.x < 0.0 || coord.x > 1.0 || coord.y < 0.0 || coord.y > 1.0)\n    {\n     \treturn vec3(0.0);   \n    }\n    \n    vec3 color = ColorFetch(coord);\n\n    return color;\n}\n\nvec3 Grab4(vec2 coord, const float octave, const vec2 offset)\n{\n \tfloat scale = exp2(octave);\n    \n    coord += offset;\n    coord *= scale;\n\n   \tif (coord.x < 0.0 || coord.x > 1.0 || coord.y < 0.0 || coord.y > 1.0)\n    {\n     \treturn vec3(0.0);   \n    }\n    \n    vec3 color = vec3(0.0);\n    float weights = 0.0;\n    \n    const int oversampling = 4;\n    \n    for (int i = 0; i < oversampling; i++)\n    {    \t    \n        for (int j = 0; j < oversampling; j++)\n        {\n\t\t\tvec2 off = (vec2(i, j) / iResolution.xy + vec2(0.0) / iResolution.xy) * scale / float(oversampling);\n            color += ColorFetch(coord + off);\n            \n\n            weights += 1.0;\n        }\n    }\n    \n    color /= weights;\n    \n    return color;\n}\n\nvec3 Grab8(vec2 coord, const float octave, const vec2 offset)\n{\n \tfloat scale = exp2(octave);\n    \n    coord += offset;\n    coord *= scale;\n\n   \tif (coord.x < 0.0 || coord.x > 1.0 || coord.y < 0.0 || coord.y > 1.0)\n    {\n     \treturn vec3(0.0);   \n    }\n    \n    vec3 color = vec3(0.0);\n    float weights = 0.0;\n    \n    const int oversampling = 8;\n    \n    for (int i = 0; i < oversampling; i++)\n    {    \t    \n        for (int j = 0; j < oversampling; j++)\n        {\n\t\t\tvec2 off = (vec2(i, j) / iResolution.xy + vec2(0.0) / iResolution.xy) * scale / float(oversampling);\n            color += ColorFetch(coord + off);\n            \n\n            weights += 1.0;\n        }\n    }\n    \n    color /= weights;\n    \n    return color;\n}\n\nvec3 Grab16(vec2 coord, const float octave, const vec2 offset)\n{\n \tfloat scale = exp2(octave);\n    \n    coord += offset;\n    coord *= scale;\n\n   \tif (coord.x < 0.0 || coord.x > 1.0 || coord.y < 0.0 || coord.y > 1.0)\n    {\n     \treturn vec3(0.0);   \n    }\n    \n    vec3 color = vec3(0.0);\n    float weights = 0.0;\n    \n    const int oversampling = 16;\n    \n    for (int i = 0; i < oversampling; i++)\n    {    \t    \n        for (int j = 0; j < oversampling; j++)\n        {\n\t\t\tvec2 off = (vec2(i, j) / iResolution.xy + vec2(0.0) / iResolution.xy) * scale / float(oversampling);\n            color += ColorFetch(coord + off);\n            \n\n            weights += 1.0;\n        }\n    }\n    \n    color /= weights;\n    \n    return color;\n}\n\nvec2 CalcOffset(float octave)\n{\n    vec2 offset = vec2(0.0);\n    \n    vec2 padding = vec2(10.0) / iResolution.xy;\n    \n    offset.x = -min(1.0, floor(octave / 3.0)) * (0.25 + padding.x);\n    \n    offset.y = -(1.0 - (1.0 / exp2(octave))) - padding.y * octave;\n\n\toffset.y += min(1.0, floor(octave / 3.0)) * 0.35;\n    \n \treturn offset;   \n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 uv = fragCoord.xy / iResolution.xy;\n    \n    \n    vec3 color = vec3(0.0);\n    \n    /*\n    Create a mipmap tree thingy with padding to prevent leaking bloom\n   \t\n\tSince there's no mipmaps for the previous buffer and the reduction process has to be done in one pass,\n    oversampling is required for a proper result\n\t*/\n    color += Grab1(uv, 1.0, vec2(0.0,  0.0)   );\n    color += Grab4(uv, 2.0, vec2(CalcOffset(1.0))   );\n    color += Grab8(uv, 3.0, vec2(CalcOffset(2.0))   );\n    color += Grab16(uv, 4.0, vec2(CalcOffset(3.0))   );\n    color += Grab16(uv, 5.0, vec2(CalcOffset(4.0))   );\n    color += Grab16(uv, 6.0, vec2(CalcOffset(5.0))   );\n    color += Grab16(uv, 7.0, vec2(CalcOffset(6.0))   );\n    color += Grab16(uv, 8.0, vec2(CalcOffset(7.0))   );\n\n\n    fragColor = vec4(color, 1.0);\n}",
            "name": "Buffer B",
            "description": "",
            "type": "buffer"
          },
          {
            "outputs": [
              {
                "channel": 0,
                "id": "4sXGR8"
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
              }
            ],
            "code": "//Horizontal gaussian blur leveraging hardware filtering for fewer texture lookups.\n\nvec3 ColorFetch(vec2 coord)\n{\n \treturn texture(iChannel0, coord).rgb;   \n}\n\nfloat weights[5];\nfloat offsets[5];\n\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{    \n    \n    weights[0] = 0.19638062;\n    weights[1] = 0.29675293;\n    weights[2] = 0.09442139;\n    weights[3] = 0.01037598;\n    weights[4] = 0.00025940;\n    \n    offsets[0] = 0.00000000;\n    offsets[1] = 1.41176471;\n    offsets[2] = 3.29411765;\n    offsets[3] = 5.17647059;\n    offsets[4] = 7.05882353;\n    \n    vec2 uv = fragCoord.xy / iResolution.xy;\n    \n    vec3 color = vec3(0.0);\n    float weightSum = 0.0;\n    \n    if (uv.x < 1.12)\n    {\n        color += ColorFetch(uv) * weights[0];\n        weightSum += weights[0];\n\n        for(int i = 1; i < 5; i++)\n        {\n            vec2 offset = vec2(offsets[i]) / iResolution.xy;\n            color += ColorFetch(uv + offset * vec2(0.5, 0.0)) * weights[i];\n            color += ColorFetch(uv - offset * vec2(0.5, 0.0)) * weights[i];\n            weightSum += weights[i] * 2.0;\n        }\n\n        color /= weightSum;\n    }\n\n    fragColor = vec4(color,1.0);\n}",
            "name": "Buffer C",
            "description": "",
            "type": "buffer"
          },
          {
            "outputs": [
              {
                "channel": 0,
                "id": "XdfGR8"
              }
            ],
            "inputs": [
              {
                "channel": 0,
                "type": "buffer",
                "id": "4sXGR8",
                "filepath": "/media/previz/buffer02.png",
                "sampler": {
                  "filter": "linear",
                  "wrap": "clamp",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "//Vertical gaussian blur leveraging hardware filtering for fewer texture lookups.\n\nvec3 ColorFetch(vec2 coord)\n{\n \treturn texture(iChannel0, coord).rgb;   \n}\n\nfloat weights[5];\nfloat offsets[5];\n\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{    \n    \n    weights[0] = 0.19638062;\n    weights[1] = 0.29675293;\n    weights[2] = 0.09442139;\n    weights[3] = 0.01037598;\n    weights[4] = 0.00025940;\n    \n    offsets[0] = 0.00000000;\n    offsets[1] = 1.41176471;\n    offsets[2] = 3.29411765;\n    offsets[3] = 5.17647059;\n    offsets[4] = 7.05882353;\n    \n    vec2 uv = fragCoord.xy / iResolution.xy;\n    \n    vec3 color = vec3(0.0);\n    float weightSum = 0.0;\n    \n    if (uv.x < 0.52)\n    {\n        color += ColorFetch(uv) * weights[0];\n        weightSum += weights[0];\n\n        for(int i = 1; i < 5; i++)\n        {\n            vec2 offset = vec2(offsets[i]) / iResolution.xy;\n            color += ColorFetch(uv + offset * vec2(0.0, 0.5)) * weights[i];\n            color += ColorFetch(uv - offset * vec2(0.0, 0.5)) * weights[i];\n            weightSum += weights[i] * 2.0;\n        }\n\n        color /= weightSum;\n    }\n\n    fragColor = vec4(color,1.0);\n}",
            "name": "Buffer D",
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
          "id": "dtBBRc",
          "date": "1694299780",
          "viewed": 2315,
          "name": "Psychedelic spins",
          "username": "rcargou",
          "description": "have fun",
          "likes": 62,
          "published": 3,
          "flags": 32,
          "usePreview": 1,
          "tags": [
            "sdf",
            "psychedelic",
            "sphericalcoordinates",
            "symetry"
          ],
          "hasliked": 0,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);
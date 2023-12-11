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
                  "filter": "nearest",
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
                  "filter": "nearest",
                  "wrap": "clamp",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              },
              {
                "channel": 2,
                "type": "texture",
                "id": "4dXGzr",
                "filepath": "/media/a/08b42b43ae9d3c0605da11d0eac86618ea888e62cdd9518ee8b9097488b31560.png",
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
            "code": "// Soccermania 3d by Kastorp\n//--------------------------------\n\nfloat pitch(vec2 uv)\n{\n    float d =1e5;\n    uv=abs(uv);\n    d=min(d,abs(length(uv) - .18));\n    d=min(d,max(uv.x- PC.x +.34, abs(length(uv-vec2(PC.x-.27,0)) - .18)));\n    d=min(d,abs(sdBox(uv-vec2(PC.x/2.,0),vec2(PC.x/2.,PC.y))));\n    d=min(d,abs(sdBox(uv-vec2(PC.x-.17,0),vec2(.17,.4))));\n    d=min(d,abs(sdBox(uv-vec2(PC.x-.05,0),vec2(.05,.15))));\n    d=min(d,length(uv-vec2(PC.x-.25,0.)));\n    return d;\n}\n\n\n\n//---------render functions--------------------------\nstruct RayIn{\n    vec3 rd;\n    float t; \n};\n\nstruct RayOut{   \n    float tN;\n    float tF;\n    vec3 n;\n    vec3 fuv;\n    float id;\n};\n\nRayOut sRayOut(float d,float id) {return RayOut(d,0.,vec3(0),vec3(0),id);}\nRayOut tRayOut(vec2 d,float id) {return RayOut(d.x,d.y,oNor,oFuv,id);}\n\nconst RayIn rSDF=RayIn(vec3(0),-1.);\n\nRayOut RotSphere( in RayIn m,vec3 p, float ra ,float a, float id)\n{\n\n        vec2 v = iSphere(p,m.rd,ra);\n        oFuv.z-=a*ra*1.57;\n        return  tRayOut(v,id);\n}\n\nRayOut Box(  in RayIn m,vec3 p, in vec3 b,float id)\n{\n    return  tRayOut(iBox(p,m.rd,b),id);\n}\n\nRayOut RotBox(  in RayIn m, vec3 p, in vec3 b, vec3 ax, vec3 c, float a,float id)\n{\n    vec3 pr=  c+ erot( p-c , ax, a); \n    m.rd=  erot( m.rd , ax, a); \n\n          vec2 d=iBox(pr,m.rd,b);\n          return RayOut(d.x,d.y, erot( oNor , ax, a),oFuv,id);\n\n}\nRayOut Plane(  in RayIn m, vec3 p, in vec3 n ,float h,float id)\n{\n return  tRayOut(iPlane(p,m.rd,n,h),id);\n}\n\n\nRayOut Union( RayOut a, RayOut b)\n{\n   if(a.tN<b.tN) return a;\n   else return b;\n}\n#define Add(_ro,_func) _ro = Union(_ro,_func);\n\n#define  RotView( p, _ri,_ro, _ax,  _c ,  _a,  _body) \\\n    p=  _c+ erot( p-_c , _ax, _a); \\\n    _ri.rd=  erot( _ri.rd , _ax, _a); \\\n    _body \\\n    _ro.n=erot( _ro.n , _ax, -_a); \n\n\n//------------------------------------\n\nRayOut oRay;\nfloat map(in RayIn m0,vec3 p0 ) { \n    RayOut r =  Plane(m0,p0,vec3(0,1.0,0),0.,1.);\n    //walls\n    Add(r,Box(m0,p0-vec3(0,0.,SIZE*1.3),vec3(SIZE*2.2,5.,1.),7.));\n    Add(r,Box(m0,p0-vec3(0,0.,-SIZE*1.3),vec3(SIZE*2.2,5.,1.),7.));\n    Add(r,Box(m0,p0-vec3(SIZE*PC.x*2.3,0.,0.),vec3(1.,5.,SIZE*1.3),7.));\n    Add(r,Box(m0,p0-vec3(-SIZE*PC.x*2.3,0.,0.),vec3(1.,5.,SIZE*1.3),7.));\n  \n  // RayOut r0=Box(m0,p0,vec3(SIZE*2.2,3.,SIZE),2.); //bounding box:  field\n  // if(  (m0.t<0.  && r0.tN <.5) || (m0.t>=0. && r0.tN>=0. && r0.tN<NOHIT)){\n  RayOut r0;\n  if(true){\n    \n    //bars\n    Add(r,Box(m0,p0-vec3(SIZE*PC.x*2.,1.,SIZE*0.15),vec3(SIZE*tk,2.,SIZE*tk),3.));\n    Add(r,Box(m0,p0-vec3(SIZE*PC.x*2.,1.,-SIZE*0.15),vec3(SIZE*tk,2.,SIZE*tk),3.));\n    Add(r,Box(m0,p0-vec3(SIZE*PC.x*2.,3.,0.),vec3(SIZE*tk,SIZE*tk,SIZE*.15),3.));\n    Add(r,Box(m0,p0-vec3(-SIZE*PC.x*2.,1.,SIZE*0.15),vec3(SIZE*tk,2.,SIZE*tk),3.));\n    Add(r,Box(m0,p0-vec3(-SIZE*PC.x*2.,1.,-SIZE*0.15),vec3(SIZE*tk,2.,SIZE*tk),3.));\n    Add(r,Box(m0,p0-vec3(-SIZE*PC.x*2.,3.,0.),vec3(SIZE*tk,SIZE*tk,SIZE*.15),3.));\n    for(int i=0;i<=22;i++)\n    {\n        vec4 pl=  texelFetch(iChannel0,ivec2(i,0),0);\n        vec3 p= p0 - vec3(pl.x,0.,pl.y)*40.;\n        float a =pl.z+1.57;\n       \n        r0=Box(m0,p,vec3(.45,2.2,.45),2.);//bounding box:  player\n        if((m0.t<0. && r0.tN <.5) || (m0.t>=0. && r0.tN>=0. && r0.tN<NOHIT)){\n            RayIn ri_player=m0;\n            RayOut ro_player;\n            if(i==0){\n                //ball\n                 ro_player= RotSphere(ri_player,p-vec3(0,.1,0),.18,a,3.); \n            }\n            else{\n                 float fl= (mod(pl.w*.5,0.04)-0.02);\n                 float mat_id=(i<12? 5.:4.),sk_id=2.+float(i&1)*4.;\n                 if(i==1 || i==12) mat_id=8.;\n                Add(r,RotSphere(ri_player,p-vec3(0,2.,0),.18,a,sk_id)); //todo fix head rotation\n   \n                RotView(p,ri_player,ro_player, vec3(0,1,0),vec3(0.,0,0), a, //player rotation\n                \n                 \n                ro_player=  Box(ri_player,p-vec3(0,1.43,0),vec3(.28,.35,.1),mat_id);\n                float mrot=.4; float rot= abs(mod(fl*20.,mrot*3.)-mrot);\n               \n                Add(ro_player,RotBox(ri_player,p-vec3(+.4,1.47,0),vec3(.08,.3,.08),vec3(1,0,0),vec3(0,0.25,0),rot-mrot*.5,sk_id));\n                Add(ro_player,RotBox(ri_player,p-vec3(-.4,1.47,0),vec3(.08,.3,.08),vec3(1,0,0),vec3(0,0.25,0),mrot*.5 -rot,sk_id));    \n                Add(ro_player,RotBox(ri_player,p-vec3(+.17,.5,0),vec3(.08,.5,.08),vec3(1,0,0),vec3(0,0.35,0),mrot*.5 -rot,sk_id));\n                Add(ro_player,RotBox(ri_player,p-vec3(-.17,.5,0),vec3(.08,.5,.08),vec3(1,0,0),vec3(0,0.35,0),rot-mrot*.5,sk_id));\n            );\n           }\n            r= Union(r,ro_player);\n        } else if( r0.tN >=.5) r=Union(r,r0); //outside player BB\n    }\n    }else if( r0.tN >=.5) r=Union(r,r0);//outside field BB\n    oRay=r;\n    return r.tN;\n}\n\nvec3[8] mat = vec3[8](\n    vec3(0.184,0.380,0.082), //pitch\n    vec3(0.914,0.584,0.584), //pale skin\n    vec3(0.945,0.933,0.635), //ball\n    vec3(0.294,0.420,0.925), //blue\n    vec3(0.855,0.043,0.043), //red\n    vec3(0.251,0.047,0.047),  //dark skin\n    vec3(0.275,0.267,0.267),  //wall\n    vec3(0.973,0.941,0.051)   //goalkeeper\n    );\n\n//------------------------------------\nfloat trace(vec3 ro, vec3 rd) {\n    return map( RayIn(rd,0.), ro);\n}\n\n\n\n\nvec3 lights(vec3 p, vec3 rd, float d) {\n    vec3 lightPos =  vec3(1500.,2000.,-500.) ;\n\tvec3 ld = normalize(lightPos - p), \n    n =  oRay.n;\n\n\tfloat l1 = max(0., .5 + .5 * dot(ld, n)),\n        spe = max(0., dot(rd, reflect(ld, n))) * .1,\n        fre = smoothstep(.7, 1., 1. + dot(rd, n));\n   \n    vec3 pp=p+.001*n;    \n\tl1 *=  .1+.9*  smoothstep(.001,500., trace(pp,ld));\n         \n\tvec3 lig = (l1+ spe) * vec3(1.) *2.5;\n\treturn mix(.3, .4, fre) * lig;\n}\n\nvec3 getRayDir(vec3 ro, vec3 lookAt, vec2 uv) {\n\tvec3 f = normalize(lookAt - ro),\n\t\t r = normalize(cross(vec3(0, 1, 0), f));\n\treturn normalize(f + r * uv.x + cross(f, r) * uv.y);\n}\n\n\nvoid mainImage(out vec4 fragColor, vec2 fc)\n{\n\tvec4 ball=  texelFetch(iChannel0,ivec2(0),0);         \n    vec4 zBall=texelFetch(iChannel1,ivec2(coord(ball.xy)),0);   \n    \n\n    \n    if(iMouse.z>0.) fc=iMouse.xy+.66*(fc-iMouse.xy);\n    vec2 uv = (fc - .5 * iResolution.xy) / iResolution.y;\n\tvec3 ro =vec3(ball.x*40.+20.,15,ball.y*20.),\n         rt= vec3(ball.x*40.,0.,.01+ball.y*20.);\t\t\n    if(texelFetch(iChannel3,ivec2(87,2),0).x<1.) {\n        ro =vec3(ball.x*12.,35,-28.);\t\n        rt=vec3(ro.x+.01,0,-4);\n    \n    } \n    vec3 rd =  getRayDir(ro, rt, uv);\n    \n        \n \n    float d=trace(ro,rd);  \n    vec3 p=ro+rd*d; \n    int mat_id=int(oRay.id)-1;\n    vec3 alb=mat[mat_id];\n    if(mat_id==0 &&  pitch(p.xz/40.)<tk) alb=vec3(1);\n    vec2 uvt= fract(oRay.fuv.yz*.1)-.5;\n    if((mat_id==0 || mat_id==6) && uvt.x*uvt.y<0.)alb*=.9;\n    vec3 col=lights(p, rd, d) * exp(-d * .001)*alb;\n    if(mat_id==0  && texelFetch(iChannel3,ivec2(32,2),0).x>0.){\n        vec2 uv2=p.xz/SIZE/2.;\n        vec4 d=texelFetch(iChannel1,ivec2(coord(uv2)),0);\n        float side = sign(zBall.x-11.5 );\n        float cScore= abs(score(side,uv2,ball,d));                        \n        int j = int(d.x);        \n        //team zones\n        col=mix(col,  ((j<12? vec3(.5,0,0):vec3(0,0,.7))), .8*smoothstep(-.3,.3,cScore));\n        vec4 b=ball;\n        vec4 zBallt=texelFetch(iChannel1,ivec2(coord(ball.xy+ball.zw*1.)),0);\n        col=mix(col, vec3(1,1,0),smoothstep(tk,.0,-.01+length(uv2-b.xy-b.zw*1.))); //ball target \n        vec4 pl=texelFetch(iChannel0,ivec2(zBall.x,0),0);\n        col=mix(col, vec3(1,0,1),smoothstep(tk,.0,-.01+length(uv2-pl.xy))); //closest player\n        vec4 plt=texelFetch(iChannel0,ivec2(zBallt.x,0),0);\n        col=mix(col, vec3(0,1,1),smoothstep(tk,.0,-.01+length(uv2-plt.xy))); //target player   \n        vec2 offs=texelFetch(iChannel0,ivec2(27,0),0).xy;\n        col=mix(col, vec3(.5,.5,0),smoothstep(tk,0.,min(abs(uv2.x-offs.x),abs(uv2.x-offs.y))));        \n    }\n    \n    \n    //score\n    ivec4 sc= ivec4( texelFetch(iChannel0,ivec2(25,0),0));\n    drawChar(iChannel2, col, vec3(0.,.7,0), uv, vec2(-0.05,.45), vec2(.1), 48+sc.x);\n    drawChar(iChannel2,col, vec3(0.,.7,0), uv, vec2(0.00,.45), vec2(.1), 45);\n    drawChar(iChannel2,col, vec3(0.,.7,0), uv, vec2(0.05,.45), vec2(.1), 48+sc.y);\n    fragColor = vec4(pow(col, vec3(.45)), 0);\n}",
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
                  "filter": "nearest",
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
                  "filter": "nearest",
                  "wrap": "clamp",
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
            "code": "//BUFFER A: game engine\n#define module 1\nvec2 T[22] =vec2[22](\n    //red team 4-4-2\n    vec2(.92,0),\n    vec2(.6,.36),vec2(.6,.12),vec2(.6,-.12),vec2(.6,-.36),\n    vec2(.3,.36),vec2(.3,.12),vec2(.3,-.12),vec2(.3,-.36),\n    vec2(.05,.18),vec2(.05,-.18),\n    //blue team \n    vec2(-.92,0),\n#if (module==1) \n    // 4-3-3\n    vec2(-.6,.36),vec2(-.6,.12),vec2(-.6,-.12),vec2(-.6,-.36),\n    vec2(-.3,-.32), vec2(-.4,.0),vec2(-.3,.32),\n    vec2(-.05,.25),vec2(-.05,.0),vec2(-.05,-.25)\n#elif(module==2)\n    // 4-4-2\n    vec2(-.6,.36),vec2(-.6,.12),vec2(-.6,-.12),vec2(-.6,-.36),\n    vec2(-.3,.36),vec2(-.3,.12),vec2(-.3,-.12),vec2(-.3,-.36),\n    vec2(-.05,.18),vec2(-.05,-.18)\n#elif(module==3)\n    // 3-4-3\n    vec2(-.6,.24),vec2(-.6,.0),vec2(-.6,-.24),\n    vec2(-.4,.36),vec2(-.3,.12),vec2(-.3,-.12),vec2(-.4,-.36),\n    vec2(-.05,.18),vec2(-.0,0.),vec2(-.05,-.18)\n#else\n    //4-2-4\n    vec2(-.6,.36),vec2(-.6,.12),vec2(-.6,-.12),vec2(-.6,-.36),\n    vec2(-.3,.12), vec2(-.3,-.12),\n    vec2(-.05,.36),vec2(-.05,.18),vec2(-.05,-.18),vec2(-.05,-.36)\n#endif\n  );\n\n\nvec2 hash21(float p)\n{\n\tvec3 p3 = fract(vec3(p) * vec3(.1031, .1030, .0973));\n\tp3 += dot(p3, p3.yzx + 33.33);\n    return fract((p3.xx+p3.yz)*p3.zy);\n\n}\nvoid mainImage( out vec4 O, in vec2 U )\n{\n    if(U.y>1. || U.x>28.) discard;\n    \n    //who am I?\n    int i=int(U.x);\n    //who's near ball?\n    vec4 ball=  texelFetch(iChannel0,ivec2(0),0);\n    vec4 zBall=texelFetch(iChannel1,ivec2(coord(ball.xy) ),0);     \n    float zBalld= sdSegment(texelFetch(iChannel0,ivec2(zBall.x,0),0).xy,ball.xy,ball.xy-ball.zw*.04);\n    \n    ivec4 mode= ivec4( texelFetch(iChannel0,ivec2(24,0),0));\n    bool demo = true;//!(texelFetch(iChannel3,ivec2(67,2),0).x>0.);\n \n    \n    if(iFrame==0) //initialize\n        O = i==0 ? vec4(0,0,0,0): //ball\n             i<23 ? vec4(.48 - U.x*.04,.0 ,0,0): //players\n             i==24? vec4(0,F_START,0,0): //mode\n                    vec4(0); //score && last player kick\n    else if(  texelFetch(iChannel3,ivec2(65,2),0).x>0.){\n        O=texelFetch(iChannel0,ivec2(U),0);\n        return;\n\n    } \n    else if(i==24){ //mode (0=goal kick, 1 =game, 2=throw-in)\n       int lastP= int( texelFetch(iChannel0,ivec2(26,0),0).x);\n       if(any(greaterThan(ball.xy,PC)) || any(lessThan(ball.xy,-PC))) mode=ivec4(CORNERS,iFrame+F_START,lastP,0);\n       else if( mode.x==0 && iFrame>mode.y) mode=ivec4(1,iFrame+F_START,0,0);\n       else if( mode.x==2 && length(ball.zw)>.001 ) mode=ivec4(1,iFrame+F_START*(length(ball.xy)<.05?53:1) ,0,0);\n              \n       O=vec4(mode);       \n    }\n    else if(i==25){ //scores\n        ivec4 sc= ivec4( texelFetch(iChannel0,ivec2(25,0),0));\n        if( abs(ball.y)<=.07 && mode.x==1){ \n            if(ball.x>PC.x ) sc.x++; //blue goal\n            if(ball.x<-PC.x) sc.y++; //red goal\n            if(max(sc.x,sc.y)>9) sc.xy=ivec2(0);//reset\n        }\n        O=vec4(sc);       \n    }\n    else if(i==26 ){\n        // stores last kicking player \n        O= texelFetch(iChannel0,ivec2(26,0),0);\n        if(mode.x==1  &&  zBalld <.01){           \n                if((iMouse.z>0. && zBall.x<11.5  )\n                || (zBall.x>11.5 || demo)) O=vec4(zBall.x);\n        }\n        if(mode.x==2 && zBalld<.01) O=vec4(zBall.x);\n    }\n    else if(i==27 ){\n        O =vec4(0); //offside position (midfield)\n        for(int i=1;i<=22;i++)\n        {\n            vec2 p=  texelFetch(iChannel0,ivec2(i,0),0).xy;\n            if(i>1&& i<12) O.x=max(O.x,p.x);\n            if(i>13) O.y=min(O.y,p.x);\n        }\n        \n        \n    }\n    else if(i==0 ){ //ball\n        O =  texelFetch(iChannel0,ivec2(0),0);\n        \n        //ball movement\n        vec2  pBall=vec2(O.xy), vBall=vec2(O.zw);\n        vBall*=.96;\n        pBall+= vBall*.04;\n        \n        if(mode.x==1 ){//&& all(greaterThanEqual(pBall,-PC)) || all(lessThanEqual(pBall,PC))){\n            //ball kicked\n            if( zBalld<.01 ){\n                /*\n                if(iMouse.z>0. && zBall.x<11.5  ){\n                    //mouse target\n                    vec2 pMouse =position(iMouse.xy);\n                    float power=  max(length(pBall-pMouse),.12);                              \n                    if(texelFetch(iChannel3,ivec2(65,0),0).x>0.) power=.9 ;\n                    if(texelFetch(iChannel3,ivec2(83,0),0).x>0.) power=.5 ;\n                    vBall =-normalize(pBall-pMouse)*min(power,.9) *1.2;\n                }else\n                */\n                 \n                if(zBall.x>11.5 || demo) {\n                    //find best shot on random set\n                    float side = sign(zBall.x-11.5 );\n                    float score=-1e5;\n                    for(int j=0;j< 300;j++){\n                        vec2 tDir =-normalize(pBall- vec2(side*PC.x,0))*.4;\n                        vec2 cvBall= tDir + hash21(iTime +float(j)*3.1)*.6-.3 ;\n\n                        vec2 tPos=pBall + cvBall*1.02; //final ball position (estimation)\n                        if(tPos.x>PC.x*1.05 || tPos.x<-PC.x*1.05)  \n                        {\n                            //evaluate shot score\n                            float cScore = +( abs(tPos.y) <.07  && tPos.x*side>PC.x ?5.:-1.);\n                            if (cScore>score) {\n                                vBall=cvBall;\n                                score=cScore;\n                            }\n                        } \n                        vec4 zzBall=texelFetch(iChannel1,ivec2(coord(tPos) ),0); \n                        // evaluate passing score\n                        float cScore= -.02 + abs(score(side,tPos,ball,zzBall));\n                        //(tPos.x-zBall.x)*side *(.03+  smoothstep(.05,.2, zzBall.w-zzBall.y)*2.)  *smoothstep(PC.y*.9,PC.y*.5,abs(tPos.y));\n                        if(score<0. ||(cScore>score &&  sign(zzBall.x-11.5 )*side>0. )){\n                            vBall=cvBall;\n                            score=cScore;\n                        }\n                    }\n                 }          \n            }\n\n            O = vec4(pBall,vBall);\n        }\n        else if(mode.x==2 ) {           \n            //WORK IN PROGRESS \n            if( abs(pBall.x)>PC.x && abs(pBall.y)<.07) O=vec4(-.01*sign(pBall.x),0,0,0); //goal\n            else if(pBall.x>PC.x && mode.z <=11)  O=vec4(vec2(PC.x,PC.y*sign(pBall.y)),vec2(0)); //corner blue\n            else if(pBall.x<-PC.x && mode.z> 11) O=vec4(vec2(-PC.x,PC.y*sign(pBall.y)),vec2(0)); //corner red\n            else if(pBall.x>PC.x && mode.z> 11)  O=vec4(vec2(PC.x-.10,.15*sign(pBall.y)),vec2(0)); //throw in red\n            else if(pBall.x<-PC.x && mode.z<= 11) O=vec4(vec2(-PC.x+.10,.15*sign(pBall.y)),vec2(0)); //throw in blue\n            else if(abs(pBall.y)>PC.y)  O=vec4(pBall.x,PC.y*sign(pBall.y),0,0); //lateral             \n            else if(zBalld<.01  && iFrame>mode.y) O= vec4(pBall.xy, -normalize(pBall- vec2(0.))*.02) ;\n        }\n        else if(mode.x==0 ) O=vec4(max(-PC,min(PC,pBall)),vec2(0)); \n\n    }\n    else if(i>=1 && i<=22){ //player         \n            \n        //target position\n        vec2 p=  T[i-1];\n        //current position\n        vec4 p0=  texelFetch(iChannel0,ivec2(U),0);\n        \n        if(mode.x==2 ){\n            bool kickoff=  length(ball.xy)<.05;\n            //attack/defense\n            if(i>12 && !kickoff ) p+=  vec2( ball.x*.5  +.22 +sign(float(mode.z)-11.5) *.03 , 0);\n            if(i>1 && i<12 && !kickoff ) p+= vec2( ball.x*.5 -.22 +sign(float(mode.z)-11.5) *.03, 0);          \n            if((int(zBall.x)==i || int(zBall.z)==i  )  && ((mode.z >=12 && i<=11) || (mode.z <=11 && i>=12)) ) p=ball.xy;\n            else if( !kickoff)  p =mix( p,-ball.xy, smoothstep(.2,-.2,length(p-ball.xy)));\n        }\n        \n        if(mode.x==1 ){\n            if( (i>5 && i<12) || i>16 ){\n                  //random movements\n                  int j= (iFrame/90);\n                  vec2 rp= hash21(float(j*24 + i));                 \n                  p = clamp(p+ rp.xy*.4-.2,-PC,PC);\n            }\n            \n        \n            //attack/defense\n            if(i>12 ) p+=  vec2( ball.x*.7  +.3, ball.y*.3);\n            if(i>1 && i<12 ) p+= vec2( ball.x*.7  -.3 ,ball.y*.3);\n            \n            //return from offside\n            vec2 offs=texelFetch(iChannel0,ivec2(27,0),0).xy;          \n            if(i>1 && i<12)  p.x=max(p.x,offs.y);\n            if(i>13)  p.x=min(p.x,offs.x);\n           \n  \n            //ball is mine       \n            if(int(zBall.x)==i || int(zBall.z)==i  ) p=ball.xy;\n            else if(mode.x ==1 ) {\n                \n                vec2 pBall=max(-PC,min(PC,ball.xy +ball.zw*1.));\n                zBall=texelFetch(iChannel1,ivec2(coord(pBall)),0); \n                //ball is directed to me\n                if(int(zBall.x)==i || int(zBall.z)==i ) p=pBall;// +ball.zw*.5;\n                else {\n                \n                   // pressing  \n                    p =mix( p,max(-PC,min(PC,ball.xy)), smoothstep(.5,-.2,length(p-ball.xy)));\n                }\n            }\n        }\n        /*\n        //mouse target\n        vec2 pMouse =position(iMouse.xy);\n        if(iMouse.z>0. && dot(pMouse,p0.xy-ball.xy)<-0.5) {            \n            if(zBall.x<11.5  && int(zBall.x)==i  ) p =pMouse;\n            if(zBall.z<11.5  && int(zBall.z)==i  ) p =pMouse;\n        } */\n        \n        //player movement \n        float move =.0035; \n        //if( (texelFetch(iChannel3,ivec2(69,2),0).x>0.) && i>11) move*=.1; ;\n        p = p0.xy+  normalize(p-p0.xy)*move * min(length(p-p0.xy)*50.,1.); \n        \n        //players collisions        \n        vec4 zP=texelFetch(iChannel1,ivec2(coord(p)),0);\n        vec2 p1 =texelFetch(iChannel0,ivec2(zP.z,0),0).xy;\n        if(int(zP.z)!=i && length(p-p1)<.02) {\n            \n             p +=  normalize(p-p1)*.0035; \n        }         \n        \n        //players remain inside field\n        float run= length(p-p0.xy);\n        O = vec4(p ,run<.001? atan(-p.y+ball.y,-p.x+ball.x): atan(p.y-p0.y,p.x-p0.x),p0.w+length(p-p0.xy));\n    }\n}",
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
            "code": "//BUFFER B: \n// x= closest player for each position, y=distance\n// z= closest player for the other team, w=distance\n\nvoid mainImage( out vec4 O, in vec2 U )\n{\n    O = vec4(0,1e5,0,1e5);\n    vec2 uv =  position(U);\n    vec4 ball=  texelFetch(iChannel0,ivec2(0),0);\n    \n    for(int i=1;i<=22;i++)\n    {\n        vec2 p=  texelFetch(iChannel0,ivec2(i,0),0).xy;\n        float  d_fin=  length(p-uv); //final position\n        \n        if(i<12 && d_fin<O.y)  O.xy =vec2(i,d_fin);              \n        if(i>=12 && d_fin<O.w)O.zw=vec2(i,d_fin);              \n\n    }\n    for(int i=1;i<=22;i++)\n    {\n        vec2 p=  texelFetch(iChannel0,ivec2(i,0),0).xy;\n        //TODO: implement ball marching instead of approximation\n        float d_int=  sdSegment(p,ball.xy,uv)-.01- length(ball.xy-p)*.12; //interception distance \n        if(i<12 && d_int<0.) O.w=1e5;\n        if(i>=12 && d_int<0.) O.y=1e5;\n\n    }   \n    if(O.w<O.y) O= O.zwxy;\n    \n    \n    \n}",
            "name": "Buffer B",
            "description": "",
            "type": "buffer"
          },
          {
            "outputs": [],
            "inputs": [],
            "code": "#define R iResolution\n#define PC vec2(.95,.52) //pitch size \n#define F_START 180 //waiting time before kick off\n#define tk .004 //line thickness\n#define CORNERS 2 //0=disabled, 2= enable corners & throw-ins\n//#define ZERO min(iFrame, 0)\n#define SIZE 20.\n#define coord(p) (p*min(R.y/PC.y/2.,R.x/PC.x/2.)/1.05 + R.xy*.5)\n#define position(U) ((U - R.xy*.5) /min(R.y/PC.y/2.,R.x/PC.x/2.)*1.05)\n#define score(s,p,b,d) s*(.5+b.x)/.5*(.03+  smoothstep(.05,.2,abs( d.w-d.y))*2.)*smoothstep(PC.y*.95,PC.y*.6,abs(p.y))\n \n//------------sdf functions \nfloat sdBox( in vec2 p, in vec2 b )\n{\n    vec2 d = abs(p)-b;\n    return length(max(d,0.0))  + min(max(d.x,d.y),0.0);\n}\n\nfloat sdSegment( in vec2 p, in vec2 a, in vec2 b )\n{\n    vec2 pa = p-a, ba = b-a;\n    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );\n    return length( pa - ba*h );\n}\n\n//----------------------------------\n// from https://www.shadertoy.com/view/3tyfzV\nvoid drawChar(sampler2D ch, inout vec3 color, in vec3 charColor, in vec2 p, in vec2 pos, in vec2 size, in int char) {\n    p = (p - pos) / size + 0.5;\n    if (all(lessThan(abs(p - 0.5), vec2(0.5)))) {\n        float val = textureGrad(ch, p / 16.0 + fract(vec2(char, 15 - char / 16) / 16.0), dFdx(p / 16.0), dFdy(p / 16.0)).r;\n        color = mix(color, charColor, val);\n    }\n}\n\n                    \n//-----------Intersection functions--------------------\n\n//@Blackle\nvec3 erot(vec3 p, vec3 ax, float ro) {\n    return mix(dot(p,ax)*ax,p,cos(ro))+sin(ro)*cross(ax,p);\n}\n                    \n#define NOHIT 1e5\nvec3 oFuv; \nvec3 oNor;\nvec2 iSphere( in vec3 ro, in vec3 rd, float ra )\n{\n    vec3 oc = ro ;\n    float b = dot( oc, rd );\n    float c = dot( oc, oc ) - ra*ra;\n    float h = b*b - c;\n    if( h<0. ) return vec2(NOHIT); // no intersection\n    h = sqrt( h );\n    oNor =normalize(ro-(b+h)*rd); oFuv=vec3(0.,atan(oNor.y,length(oNor.xz)),atan(oNor.z,oNor.x))*ra*1.5708  ;\n    return h-b < 0. ? vec2(NOHIT) : -b-h>=0. ?  vec2(-b-h,+b-h): vec2(0.);\n\n}\n\nvec2 iBox( in vec3 ro, in vec3 rd, vec3 boxSize) \n{\n\n    vec3 m = 1./rd; \n    vec3 n = m*ro;   \n    vec3 k = abs(m)*boxSize;\n\n    vec3 t1 = -n - k;\n    vec3 t2 = -n + k;\n    float tN = max( max( t1.x, t1.y ), t1.z );\n    float tF = min( min( t2.x, t2.y ), t2.z );\n    if( tN>tF || tF<0.) return vec2(NOHIT); // no intersection\n    oNor = -sign(rd)*step(t1.yzx,t1.xyz)*step(t1.zxy,t1.xyz); \n    oFuv=vec3( dot(abs(oNor),vec3(1,5,9)+ oNor)/2.,dot(ro+rd*tN,oNor.zxy),dot(ro+rd*tN,oNor.yzx));   \n    return tN<0.? vec2(0.): vec2(tN,tF);\n\n}\n\nvec2 iPlane( in vec3 ro, in vec3 rd, in vec3 n ,float h)\n{\n\n    float d= -(dot(ro,n)+h)/dot(rd,n);\n    oFuv.yz=(ro+d*rd).xz;\n    oNor=n;\n    return d>0.?vec2(d,NOHIT):vec2(NOHIT);\n\n}",
            "name": "Common",
            "description": "",
            "type": "common"
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
          "id": "mdyfzW",
          "date": "1697982723",
          "viewed": 747,
          "name": "Soccermania 3D",
          "username": "kastorp",
          "description": "press bar to view passing zones, w to toggle view\nThe reference game is [url=https://www.youtube.com/watch?v=27PKrCBkue8]total soccer[/url], which I still play sometimes\n",
          "likes": 60,
          "published": 1,
          "flags": 48,
          "usePreview": 0,
          "tags": [
            "game",
            "football",
            "soccer"
          ],
          "hasliked": 0,
          "parentid": "7sK3WK",
          "parentname": "Soccermania"
        }
      }
];

compileAndStart(jsnShader);
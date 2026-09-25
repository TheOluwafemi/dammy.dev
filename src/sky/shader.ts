// From BUILD-SPEC.md §5.5, with one addition: `veil` / `vc`, a contrast veil laid over the sky
// before the cloud text (so the headline stays bright). Domain-warped fbm sky, a sun or moon,
// twinkling stars, cloud text sampled from a texture and dispersed around the pointer, and grain.

export const VERTEX = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'

export const FRAGMENT = `precision highp float;
uniform vec2 r,m;uniform float t,mp,stars,sc,txtOn,g,warm,veil;uniform vec3 c0,c1,c2,c3,sun,vc;uniform sampler2D tx;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+17.;a*=.5;}return v;}
void main(){vec2 uv=gl_FragCoord.xy/r;vec2 asp=vec2(r.x/r.y,1.);
vec2 dm=(uv-m)*asp;float d=length(dm);
vec2 p=uv*asp*1.6;p-=dm*.8*exp(-d*5.)*mp;
vec2 q=vec2(fbm(p+t*.04),fbm(p+vec2(5.2,1.3)-t*.03));
vec2 w=vec2(fbm(p+2.4*q+vec2(1.7,9.2)+t*.02),fbm(p+2.4*q+vec2(8.3,2.8)));
float f=fbm(p+2.*w);
vec3 col=mix(c0,c1,smoothstep(.25,.75,f));
col=mix(col,c2,smoothstep(.35,.95,length(w)*.85));
col=mix(col,c3,smoothstep(.6,.98,q.y)*.4);
vec2 sd=(uv-sun.xy)*asp;float sl=length(sd);
vec3 s3=mix(mix(vec3(.96,.98,1.),vec3(1.,.9,.72),warm),vec3(.93,.95,1.),sun.z);
col+=s3*(.5*smoothstep(.066,.056,sl)+(.12+.14*warm)*exp(-sl*6.))*(1.-.45*sun.z);
vec2 gp=floor(gl_FragCoord.xy/3.);float st=step(.9974,h(gp))*(.55+.45*sin(t*2.+h(gp+3.)*40.));
col+=st*stars*.9;
col=mix(col,vc,veil);
vec2 tu=uv;tu.y-=sc;
vec2 push=(dm/max(d,1e-3))/asp*.075*exp(-d*6.)*mp;
tu+=(vec2(fbm(uv*4.*asp+t*.12),fbm(uv*4.*asp+7.-t*.1))-.5)*.02-push;
float a=texture2D(tx,tu).r;
float a2=texture2D(tx,tu+vec2(-.004,.012)).r;
float nz=fbm(uv*7.*asp+vec2(t*.08,0.));
float dens=smoothstep(.3,.62,a+(nz-.5)*.38)*txtOn*(1.-.85*exp(-d*9.)*mp);
float sh=smoothstep(.25,.6,a2+(nz-.5)*.3)*txtOn;
col*=1.-.24*sh*(1.-dens);
vec3 cl=mix(vec3(1.,.985,.96),c3,.12);
col=mix(col,cl*(.9+.1*nz),dens*.96);
col+=(h(gl_FragCoord.xy+fract(t))-.5)*g;
gl_FragColor=vec4(col,1.);}`

export const UNIFORMS = ['r', 'm', 't', 'mp', 'stars', 'sc', 'txtOn', 'g', 'warm', 'veil', 'c0', 'c1', 'c2', 'c3', 'sun', 'vc', 'tx'] as const
export type Uniform = (typeof UNIFORMS)[number]

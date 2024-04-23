uniform sampler2D uTexture;

void main() {
  vec4 texColor = texture2D(uTexture, vTextureCoord);
  gl_FragColor = texColor;
}
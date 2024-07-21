require('dotenv').config();

const baseurl = process.env.BASE_URL

function buildObjectURL(minioKey) {
  return `${baseurl}/files/${minioKey}`;
}

module.exports = {
  buildObjectURL
}

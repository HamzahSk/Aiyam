const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dx16reuns',
  api_key: '175155683759265',
  api_secret: 'QJnhSUhM_iARVrXQiTrO0n2mxSA'
});

module.exports = cloudinary;
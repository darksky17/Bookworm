import { Cloudinary }  from 'cloudinary-react-native';

const cloudinary = new Cloudinary({
  cloud_name: 'bookworm-image',
  api_key: '582139938977576',
  api_secret: 'H4m4-K-eYjaUHqW9wPv3ywdw8l8',
});

export default cloudinary;  
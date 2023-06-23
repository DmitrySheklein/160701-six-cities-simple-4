import { Cities } from '../types/cities.type.js';

export const DEFAULT_AVATAR_FILE_NAME = 'default-avatar.jpg';
export const DEFAULT_CITIES_FILE_NAME = Cities.map((city) => `city-${city.toLocaleLowerCase()}.jpg`);

export const DEFAULT_STATIC_IMAGES = [DEFAULT_AVATAR_FILE_NAME, ...DEFAULT_CITIES_FILE_NAME];

export const STATIC_RESOURCE_FIELDS = [
  { property: 'avatarPath', path: 'users/avatar' },
  { property: 'preview', path: 'offers/:id/preview' },
  { property: 'images', path: 'offers/:id/images' },
  { property: 'cityImage', path: 'cities' },
];

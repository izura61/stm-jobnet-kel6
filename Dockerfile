# Gunakan image Node.js versi LTS (18 atau 20)
FROM node:18-alpine

# Tentukan direktori kerja di dalam container
WORKDIR /usr/src/app

# Salin file package.json dan package-lock.json terlebih dahulu
# Ini untuk optimasi caching Docker saat build
COPY package*.json ./

# Install dependencies (seperti express, mongoose, dll)
RUN npm install

# Salin seluruh source code proyek Anda ke dalam container
COPY . .

# Perintah untuk menjalankan aplikasi
CMD ["node", "server.js"]
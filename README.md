# crossword-web

Kelime Çengel'in arayüzü: İngilizce ↔ Türkçe çengel bulmaca oyunu.

Backend: [crossword-api](https://github.com/eyyazilimci/crossword-api)

## Teknolojiler

- React 19 + TypeScript + Vite
- Tailwind CSS 4: koyu ve açık tema
- TanStack Query: sunucu durumu
- Zustand: oyun durumu
- Motion: animasyonlar
- React Router

## Çalıştırma

```bash
npm install
npm run dev
```

Uygulama http://localhost:5173 adresinde açılır. `/api` istekleri http://localhost:5080 adresine yönlendirilir (backend'in çalışıyor olması gerekir). Farklı bir adres için `VITE_API_PROXY` (geliştirme) ya da `VITE_API_URL` (build) değişkenini kullan.

## Özellikler

- **İki mod:** TR → EN (Türkçe ipucu, İngilizce cevap) ve EN → TR (Türkçe harfli cevaplar: Ç, Ğ, İ, Ö, Ş, Ü)
- **Üç zorluk:** Kolay, Orta, Zor. Ayrıca her mod için günün bulmacası.
- **Kontrol:** Harf, kelime veya tüm bulmaca kontrol edilebilir. Hatalı harfler kırmızı görünür.
- **İpucu:** Harf ya da kelime açılabilir. Açılan harfler yeşil köşeyle işaretlenir.
- **Kayıt:** Oyun otomatik kaydedilir, kaldığın yerden devam edersin.
- **Bitirme:** Bütün hücreler dolunca bulmaca kendiliğinden gönderilir.
- **Oyunlaştırma:** XP, seviye, günlük seri, rozetler ve zayıf kelime listesi.
- **Kütüphane:** Kelime kapsamını gösterir (her kelime en az bir bulmacada) ve filtreleme sunar.
- **Mobil:** Türkçe ekran klavyesi.

## Klavye

| Tuş | İşlev |
| --- | --- |
| Harfler | Yaz ve ilerle |
| Yön tuşları | Hücreler arası hareket (dik yönde ilk basış yönü değiştirir) |
| Boşluk | Yön değiştir (yatay/dikey) |
| Tab / Enter | Sonraki kelime (Shift+Tab önceki) |
| Backspace | Sil ve geri git |

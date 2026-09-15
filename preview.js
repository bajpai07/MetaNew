/**
 * Aiyaashi — standalone UI preview.  Disposable; delete when you don't need it.
 *
 *   npm run build && node preview.js      →  http://localhost:4000
 *
 * Serves the production build together with a stub API on the same origin, so
 * every screen can be browsed with plausible data and no MongoDB, no keys and
 * no backend running. Nothing here is part of the app.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const BUILD = path.join(__dirname, 'build');
const PORT = 4000;

// The collection, as a house would hang it: menswear and womenswear on the
// same rail, each piece with its own photograph, and the order chosen rather
// than inherited.
//
// The set was curated against one question asked of every image — could this
// be part of the same Aiyaashi campaign as the pieces either side of it? Three
// failed and were replaced: a yellow-on-yellow technical coat, an emerald
// dress under coloured gels, and a knit against a turquoise wall. All three
// were attractive on their own and none of them belonged to this campaign;
// gel lighting and colour-block grounds are a different house.
//
// Colour is now paced rather than constant. The accents — red, orange, wine,
// saffron, scarlet — are set apart by neutrals so each reads as a decision
// instead of noise.
//
// Price is written against the piece, not derived from its position, so the
// order can be art-directed without a garment changing what it costs.
const CATALOGUE = [
  { name: 'Kora Silk Overshirt',      category: 'Women', price: 2400,  img: '1642618276983-51985a775142' }, // cream trouser on deep red
  { name: 'Bandhgala Wool Jacket',    category: 'Men',   price: 3180,  img: '1619603364904-c0498317e145' }, // camel overcoat, roll neck
  { name: 'Bias-Cut Slip Dress',      category: 'Women', price: 3960,  img: '1737188550231-cd8a16ec614b' }, // draped satin, terracotta
  // The signature. Full length, charcoal ground, one light — the image that
  // sets the campaign's language for everything under it.
  { name: 'Boiled Wool Overcoat',     category: 'Men',   price: 10200, img: '1784817552688-f8a3c9bbfa54' }, // white tailoring
  { name: 'Heavy Cotton Kurta',       category: 'Men',   price: 5520,  img: '1602346733051-b660c8747610' }, // printed camp shirt
  { name: 'Draped Jersey Top',        category: 'Women', price: 6300,  img: '1664076458686-3449062080ac' }, // liquid satin, long gloves
  { name: 'Twill Utility Coat',       category: 'Men',   price: 7080,  img: '1666717292307-aebb0d85df63' }, // taupe coat, ochre ground
  { name: 'Gathered Poplin Skirt',    category: 'Women', price: 7860,  img: '1663220274232-740f07723310' }, // black organza, studio
  { name: 'Raw-Edge Linen Shirt',     category: 'Men',   price: 8640,  img: '1772757844633-0f1e20b8a199' }, // black coat on deep orange
  { name: 'Silk Charmeuse Shirt',     category: 'Women', price: 9420,  img: '1551621955-fa07d4b1376b'    }, // blush and gold, interior
  { name: 'Straight Denim Trouser',   category: 'Men',   price: 11760, img: '1732464517792-7385024242a6' }, // grey blazer, black trouser
  { name: 'Crushed Velvet Column',    category: 'Women', price: 10980, img: '1773574488217-eb936b733cae' }, // wine velvet, red curtain
  { name: 'Cotton Voile Blouse',      category: 'Women', price: 12540, img: '1668952135120-7d997b1b3778' }, // sheer layering, studio
  { name: 'Wide Pleated Trouser',     category: 'Women', price: 4740,  img: '1684598273405-a228a231c66f' }, // wide trouser, seated, studio
  { name: 'Ribbed Merino Knit',       category: 'Men',   price: 13320, img: '1787436025265-bcad6b5bd1ce' }, // grey wool coat, arched window
  { name: 'Quilted Cotton Jacket',    category: 'Women', price: 14100, img: '1550872199-63f4382fe925'    }, // wrap coat over crimson
  { name: 'Tailored Linen Short',     category: 'Men',   price: 14880, img: '1602346693719-c1c05078679e' }, // suede blouson, back detail
  { name: 'Panelled Georgette Dress', category: 'Women', price: 15660, img: '1736005706314-3b58fe2a45d6' }  // scarlet gown, theatre
];

const PRODUCTS = CATALOGUE.map((piece, i) => ({
  _id: 'p' + (i + 1),
  name: piece.name,
  price: piece.price,
  basePrice: piece.price,
  originalPrice: Math.round(piece.price * 1.5),
  mrp: Math.round(piece.price * 1.5),
  category: piece.category,
  brand: 'Aiyaashi',
  stock: 6,
  image: 'https://images.unsplash.com/photo-' + piece.img + '?w=900&q=80',
  description:
    'Cut from a heavy, dry-handling cloth that holds its line through the day. Finished by hand at the shoulder and hem.'
}));

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
  '.woff2': 'font/woff2'
};

http
  .createServer((req, res) => {
    const url = req.url.split('?')[0];

    if (url.startsWith('/api/')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');

      // The real controller filters on category and searches name/category in
      // Mongo. This stub used to ignore both and hand back the whole list,
      // which made the Men and Women filters look broken locally when the
      // application and the backend were doing exactly the right thing.
      const q = new URL(req.url, 'http://x').searchParams;

      if (url === '/api/products') {
        const category = q.get('category');
        const list =
          category && category !== 'All'
            ? PRODUCTS.filter((p) => p.category.toLowerCase() === category.toLowerCase())
            : PRODUCTS;
        return res.end(JSON.stringify(list));
      }

      if (url.startsWith('/api/products/search')) {
        const term = (q.get('q') || '').trim().toLowerCase();
        const hits = term
          ? PRODUCTS.filter(
              (p) =>
                p.name.toLowerCase().includes(term) ||
                p.category.toLowerCase().includes(term)
            )
          : [];
        return res.end(JSON.stringify(hits));
      }
      if (url.startsWith('/api/products/recommendations/'))
        return res.end(JSON.stringify({ success: true, recommendations: PRODUCTS.slice(0, 3) }));
      if (url.startsWith('/api/products/')) {
        const id = url.split('/').pop();
        return res.end(JSON.stringify(PRODUCTS.find((p) => p._id === id) || PRODUCTS[0]));
      }
      if (url === '/api/metrics')
        return res.end(
          JSON.stringify({ success: true, totalRequests: 128, successRate: 96, avgGenerationTime: 21400 })
        );
      return res.end(JSON.stringify({ success: false }));
    }

    // Dev-only: ?qa=<selector index> scrolls a section into view before the
    // screenshot, so page chapters can be captured deterministically.
    const qa = /[?&]qa=([^&]*)/.exec(req.url);
    if (qa && (url === '/' || url === '/index.html')) {
      const arg = decodeURIComponent(qa[1]);
      const html = fs.readFileSync(path.join(BUILD, 'index.html')).toString();
      const inject =
        // Screenshots must show the settled state, not a frame part-way
        // through a 400ms fade — a header caught mid-transition reads as a
        // grey wash that the running site never actually holds.
        '<style>*,*::before,*::after{transition-duration:0s!important;animation-duration:0s!important}</style>' +
        '<script>(function(){var a=' + JSON.stringify(arg) + ';' +
        'setInterval(function(){var el;' +
        'if(/^\d+$/.test(a)){window.scrollTo(0,Number(a));return;}' +
        'var m=a.split("@");el=document.querySelectorAll(m[0])[Number(m[1]||0)];' +
        'if(el){window.scrollTo(0, el.getBoundingClientRect().top+window.scrollY-(Number(m[2])||0));}' +
        // Headless Chrome under --virtual-time-budget moves the scroll offset
        // without dispatching a scroll event, so anything listening for one
        // stays in its initial state and the capture lies. Poke a resize in the
        // same tick as the scroll — on a separate interval the shot can land
        // between the two and show a header that never existed.
        'window.dispatchEvent(new Event("resize"));' +
        // Lazy images below the fold often never fetch under a virtual clock,
        // so a capture of a campaign section shows the fallback ground and
        // reads as a broken image that is fine in a real browser.
        'var L=document.images;' +
        'for(var i=0;i<L.length;i++){if(L[i].loading==="lazy")L[i].loading="eager";}' +
        '},120);})();<' + '/script>';
      res.setHeader('Content-Type', 'text/html');
      res.end(html.replace('</body>', inject + '</body>'));
      return;
    }

    let file = path.join(BUILD, url === '/' ? 'index.html' : url);
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      file = path.join(BUILD, 'index.html');
    }
    res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  })
  .listen(PORT, () => {
    console.log('');
    console.log('  Aiyaashi preview  →  http://localhost:' + PORT);
    console.log('');
    console.log('  /                     the collection');
    console.log('  /products/p2          a product, then "See it on you"');
    console.log('  /login  /signup       the private entrance');
    console.log('  /cart  /checkout      the bag, then the paperwork');
    console.log('  /history              your looks');
    console.log('');
  });

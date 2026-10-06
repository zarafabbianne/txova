/* =====================================================================
   TXOVA — DADOS DA DEMONSTRAÇÃO (ficheiro único, fácil de editar)
   Tudo é fictício. Preços em meticais (MZN / MT), números inteiros.

   COMO EDITAR
   • Lojas: lista STORES. Campos: id (único, sem espaços), name, cat (id de CATEGORIES),
     kind, bairro (tem de existir em COORDS), cidade, emoji, grad [cor1, cor2], rating,
     reviews, prep (minutos de preparação), min (pedido mínimo em MT), featured (destaque
     no início), promo (texto), desc, adult (loja de bebidas alcoólicas → pede 18+).
   • Produtos: dentro de sections[].items, um por linha. Campos:
       id (único em todo o ficheiro), name, desc, price (MT), emoji
       kg      → peso aproximado (decide se cabe na mota: máx. 12 kg)
       tag     → etiqueta curta, ex.: 'Popular'
       old     → preço antigo riscado
       rx      → true = medicamento com receita (pede foto da receita)
       adult   → true = bebida alcoólica (pede confirmação 18+)
       bulky   → true = volumoso, só entrega de carro
       unit:'kg' + weights:[0.5,1,2] → vendido ao quilo; price = preço por kg
       sizes:[{ l:'1 kg', p:110, kg:1 }, { l:'25 kg', p:2150, kg:25, bulky:true }] + def (índice
             do tamanho pré-escolhido) → embalagens; price = preço do tamanho pré-escolhido
       opts    → opções (type 'one' = escolher 1, 'multi' = várias; p = acréscimo em MT)
   • Taxas de entrega: VEHICLES (base + perKm × distância). Códigos: PROMO_CODES.
   ===================================================================== */
(function () {
'use strict';

const CATEGORIES = [
  {id: 'restaurantes', name: 'Restaurantes', short: 'Restaurantes', home: 'Restaurantes', emoji: '🍲', color: '#FFE3D6'},
  {id: 'mercados', name: 'Supermercados e mercados', short: 'Mercados', home: 'Supermercados', emoji: '🛒', color: '#DDF3E6'},
  {id: 'farmacia', name: 'Farmácia', short: 'Farmácia', emoji: '💊', color: '#DCEBFF'},
  {id: 'bebidas', name: 'Bebidas e álcool', short: 'Bebidas', home: 'Bebidas e álcool', emoji: '🍻', color: '#FFF1C7'},
  {id: 'casa', name: 'Compras de casa', short: 'Casa', home: 'Compras de casa', emoji: '🧺', color: '#EEE6FF'},
  {id: 'cosmeticos', name: 'Cosméticos', short: 'Cosméticos', emoji: '💄', color: '#FBE0F0'}
];

/* Coordenadas dos bairros no mapa estilizado (viewBox 400×300) — usadas para distância e mapa */
const COORDS = {
  Baixa: [196,236],
  Central: [214,222],'Polana Cimento':[258,204],
  Museu: [236,210],'Alto Maé':[180,200],
  Malhangalene: [214,172],
  Coop: [236,128],
  Sommerschield: [268,152],
  Triunfo: [318,112],'Costa do Sol':[334,74],
  Mafalala: [190,168],
  Maxaquene: [204,140],'Polana Caniço':[262,96],
  Chamanculo: [160,176],
  Zimpeto: [150,34],
  Magoanine: [196,44],'Matola Cidade':[62,170],'Matola — Fomento':[80,204],'Matola — Liberdade':[96,132],
  Machava: [110,94],'Matola Rio':[36,226]
};

const STORES = [
  /* ---------- Sabores da Polana · Polana Cimento (restaurantes) ---------- */
  {
    id: 'sabores-polana', name: 'Sabores da Polana', cat: 'restaurantes', kind: 'Cozinha moçambicana', bairro: 'Polana Cimento', cidade: 'Maputo', emoji: '🍲', grad: ['#FF8A3D','#E8341C'], rating: 4.8, reviews: 1240, prep: 20, min: 300, featured: true, promo: 'Entrega grátis acima de 1.500 MT', desc: 'Cozinha moçambicana de casa: matapa, zambeziana, mucapata e caril.', adult: false,
    sections: [
      { title: 'Pratos tradicionais', items: [
        {id: 'mat1', name: 'Matapa com camarão', desc: 'Folhas de mandioca pisadas com amendoim, leite de coco e camarão. Servida com arroz branco.', price: 650, emoji: '🥬', kg: 0.5, tag: 'Popular'},
        {id: 'zam1', name: 'Frango à zambeziana', desc: 'Meio frango grelhado no carvão, molho de coco, alho e piri-piri. Acompanha xima ou arroz.', price: 790, emoji: '🍗', kg: 0.5, tag: 'Popular'},
        {id: 'muc1', name: 'Mucapata com caril de amendoim', desc: 'Arroz com feijão nhemba e coco, à moda da Zambézia, com caril de amendoim e frango.', price: 560, emoji: '🍚', kg: 0.5},
        {id: 'xim1', name: 'Xima com caril de peixe', desc: 'Xima de milho branco e caril de peixe serra com tomate e coco.', price: 590, emoji: '🐟', kg: 0.5},
        {id: 'fei1', name: 'Feijoada à moçambicana', desc: 'Feijão manteiga, chouriço e carne de vaca, com arroz de coco.', price: 580, emoji: '🍛', kg: 0.5}
      ] },
      { title: 'Entradas', items: [
        {id: 'bad1', name: 'Badjias (8 un.)', desc: 'Bolinhos fritos de feijão nhemba, crocantes por fora e macios por dentro.', price: 150, emoji: '🧆', kg: 0.5},
        {id: 'cha1', name: 'Chamuças de carne (6 un.)', desc: 'Massa estaladiça recheada com carne picada e especiarias.', price: 190, emoji: '🥟', kg: 0.5, tag: 'Popular'}
      ] },
      { title: 'Bebidas', items: [
        {id: 'mas1', name: 'Sumo de maçanica', desc: 'Sumo natural da fruta maçanica, feito na casa (500 ml).', price: 120, emoji: '🧃', kg: 0.5},
        {id: 'cer1', name: 'Cerveja lager nacional', desc: 'Garrafa 550 ml, bem gelada.', price: 110, emoji: '🍺', kg: 0.5, adult: true}
      ] }
    ]
  },
  /* ---------- Piri-Piri da Baixa · Baixa (restaurantes) ---------- */
  {
    id: 'piri-baixa', name: 'Piri-Piri da Baixa', cat: 'restaurantes', kind: 'Frango grelhado', bairro: 'Baixa', cidade: 'Maputo', emoji: '🍗', grad: ['#F5B700','#E85D04'], rating: 4.7, reviews: 980, prep: 15, min: 250, featured: true, promo: '-15% no frango inteiro', desc: 'Frango no carvão com o piri-piri mais famoso da Baixa.', adult: false,
    sections: [
      { title: 'Do carvão', items: [
        {id: 'pf1', name: 'Frango piri-piri inteiro', desc: 'Frango do campo grelhado no carvão com o nosso piri-piri caseiro.', price: 1350, emoji: '🔥', kg: 0.5, tag: 'Popular', old: 1590},
        {id: 'pf2', name: 'Meio frango à cafreal', desc: 'Marinado em limão, alho e malagueta, grelhado lentamente.', price: 780, emoji: '🍗', kg: 0.5},
        {id: 'pf3', name: 'Espetada mista', desc: 'Carne de vaca, frango e chouriço com pimentos.', price: 690, emoji: '🍢', kg: 0.5}
      ] },
      { title: 'Acompanhamentos', items: [
        {id: 'pa1', name: 'Batata frita', desc: 'Porção grande, estaladiça.', price: 150, emoji: '🍟', kg: 0.5},
        {id: 'pa2', name: 'Arroz de coco', desc: 'Arroz cozinhado em leite de coco fresco.', price: 150, emoji: '🍚', kg: 0.5},
        {id: 'pa3', name: 'Salada mista', desc: 'Alface, tomate, cebola e pepino.', price: 180, emoji: '🥗', kg: 0.5}
      ] },
      { title: 'Bebidas', items: [
        {id: 'pb1', name: 'Refrigerante lata', desc: 'Lata 330 ml (vários sabores).', price: 70, emoji: '🥤', kg: 0.5},
        {id: 'pb2', name: 'Cerveja preta nacional', desc: 'Garrafa 330 ml.', price: 100, emoji: '🍺', kg: 0.5, adult: true}
      ] }
    ]
  },
  /* ---------- Prego & Companhia · Sommerschield (restaurantes) ---------- */
  {
    id: 'prego-cia', name: 'Prego & Companhia', cat: 'restaurantes', kind: 'Pregos e petiscos', bairro: 'Sommerschield', cidade: 'Maputo', emoji: '🥖', grad: ['#C0582B','#7A2E12'], rating: 4.6, reviews: 712, prep: 15, min: 200, featured: true, promo: '', desc: 'Pregos, bifanas e petiscos para qualquer hora do dia.', adult: false,
    sections: [
      { title: 'Pregos', items: [
        {id: 'pr1', name: 'Prego no pão', desc: 'Bife de vaca tenro, alho e piri-piri em pão quentinho.', price: 290, emoji: '🥖', kg: 0.5, tag: 'Popular'},
        {id: 'pr2', name: 'Prego no prato', desc: 'Bife, ovo estrelado, batata frita e salada.', price: 540, emoji: '🍳', kg: 0.5},
        {id: 'pr3', name: 'Prego de camarão', desc: 'Camarão salteado em manteiga de alho no pão.', price: 460, emoji: '🦐', kg: 0.5},
        {id: 'pr4', name: 'Bifana', desc: 'Febras de porco marinadas, no pão.', price: 250, emoji: '🥪', kg: 0.5}
      ] },
      { title: 'Petiscos', items: [
        {id: 'pp1', name: 'Chamuças mistas (6 un.)', desc: 'Carne, peixe e vegetais.', price: 190, emoji: '🥟', kg: 0.5},
        {id: 'pp2', name: 'Rissóis de camarão (6 un.)', desc: 'Massa fina com recheio cremoso de camarão.', price: 240, emoji: '🥠', kg: 0.5},
        {id: 'pp3', name: 'Batata frita', desc: 'Porção média.', price: 130, emoji: '🍟', kg: 0.5}
      ] },
      { title: 'Bebidas', items: [
        {id: 'pv1', name: 'Sumo natural de manga', desc: 'Copo 400 ml.', price: 130, emoji: '🥭', kg: 0.5},
        {id: 'pv2', name: 'Água mineral 500 ml', desc: 'Sem gás.', price: 50, emoji: '💧', kg: 0.5}
      ] }
    ]
  },
  /* ---------- Marisqueira Maré Alta · Costa do Sol (restaurantes) ---------- */
  {
    id: 'mare-alta', name: 'Marisqueira Maré Alta', cat: 'restaurantes', kind: 'Mariscos e peixe', bairro: 'Costa do Sol', cidade: 'Maputo', emoji: '🦐', grad: ['#16B3C9','#0B5E8E'], rating: 4.9, reviews: 2105, prep: 30, min: 600, featured: true, promo: 'Camarão fresco do dia', desc: 'Marisco fresco à beira-mar, do pescador para a sua mesa.', adult: false,
    sections: [
      { title: 'Do mar', items: [
        {id: 'ma1', name: 'Camarão grelhado (500 g)', desc: 'Camarão tigre grelhado com molho de manteiga, alho e limão.', price: 1450, emoji: '🦐', kg: 0.5, tag: 'Popular'},
        {id: 'ma2', name: 'Lulas grelhadas', desc: 'Com batata cozida e legumes salteados.', price: 950, emoji: '🦑', kg: 0.5},
        {id: 'ma3', name: 'Caril de caranguejo', desc: 'Caranguejo de mangal em caril de coco. Com arroz ou xima.', price: 1200, emoji: '🦀', kg: 0.5, tag: 'Popular'},
        {id: 'ma4', name: 'Peixe serra grelhado', desc: 'Posta generosa com arroz de coco e salada.', price: 920, emoji: '🐟', kg: 0.5},
        {id: 'ma5', name: 'Arroz de marisco (2 pessoas)', desc: 'Camarão, lulas, amêijoa e caranguejo.', price: 2400, emoji: '🥘', kg: 0.5}
      ] },
      { title: 'Para acompanhar', items: [
        {id: 'mb1', name: 'Matapa de siri-siri', desc: 'Matapa de algas com amendoim e coco, receita da Ilha.', price: 450, emoji: '🌿', kg: 0.5},
        {id: 'mb2', name: 'Pão de alho', desc: '4 fatias.', price: 120, emoji: '🧄', kg: 0.5}
      ] }
    ]
  },
  /* ---------- Chamuçaria da Mafalala · Mafalala (restaurantes) ---------- */
  {
    id: 'chamucaria-mafalala', name: 'Chamuçaria da Mafalala', cat: 'restaurantes', kind: 'Petiscos e salgados', bairro: 'Mafalala', cidade: 'Maputo', emoji: '🥟', grad: ['#E9A23B','#B5541C'], rating: 4.7, reviews: 534, prep: 10, min: 150, featured: false, promo: '', desc: 'Chamuças e badjias feitas na hora, no coração da Mafalala.', adult: false,
    sections: [
      { title: 'Salgados', items: [
        {id: 'cm1', name: 'Chamuças de carne (6 un.)', desc: 'A receita da avó, com caril e coentros.', price: 180, emoji: '🥟', kg: 0.5, tag: 'Popular'},
        {id: 'cm2', name: 'Chamuças de peixe (6 un.)', desc: 'Peixe desfiado com cebola e limão.', price: 180, emoji: '🥟', kg: 0.5},
        {id: 'cm3', name: 'Chamuças vegetarianas (6 un.)', desc: 'Batata, ervilha e especiarias.', price: 150, emoji: '🥟', kg: 0.5},
        {id: 'cm4', name: 'Badjias (10 un.)', desc: 'Feitas na hora.', price: 150, emoji: '🧆', kg: 0.5, tag: 'Popular'},
        {id: 'cm5', name: 'Pão com badjia', desc: 'O pequeno-almoço clássico de Maputo.', price: 80, emoji: '🥯', kg: 0.5}
      ] },
      { title: 'Bebidas', items: [
        {id: 'cb1', name: 'Chá com leite', desc: 'Chá preto com leite e açúcar.', price: 60, emoji: '🍵', kg: 0.5},
        {id: 'cb2', name: 'Refresco de tamarindo', desc: 'Garrafa 500 ml.', price: 90, emoji: '🧃', kg: 0.5}
      ] }
    ]
  },
  /* ---------- Doces da Avó · Malhangalene (restaurantes) ---------- */
  {
    id: 'doces-avo', name: 'Doces da Avó', cat: 'restaurantes', kind: 'Pastelaria e café', bairro: 'Malhangalene', cidade: 'Maputo', emoji: '🍰', grad: ['#F49AC1','#C2477E'], rating: 4.8, reviews: 421, prep: 15, min: 150, featured: false, promo: '', desc: 'Pastelaria caseira e café para adoçar o dia.', adult: false,
    sections: [
      { title: 'Pastelaria', items: [
        {id: 'da1', name: 'Pastel de nata', desc: 'Acabado de sair do forno.', price: 60, emoji: '🥧', kg: 0.5, tag: 'Popular'},
        {id: 'da2', name: 'Bolo de coco (fatia)', desc: 'Húmido, com coco ralado fresco.', price: 120, emoji: '🥥', kg: 0.5},
        {id: 'da3', name: 'Bolo de mandioca (fatia)', desc: 'Receita tradicional, com leite de coco.', price: 120, emoji: '🍰', kg: 0.5},
        {id: 'da4', name: 'Sonhos (6 un.)', desc: 'Polvilhados com açúcar e canela.', price: 150, emoji: '🍩', kg: 0.5}
      ] },
      { title: 'Café', items: [
        {id: 'db1', name: 'Café expresso', desc: '', price: 80, emoji: '☕', kg: 0.5},
        {id: 'db2', name: 'Galão', desc: '', price: 110, emoji: '🥛', kg: 0.5}
      ] }
    ]
  },
  /* ---------- Mercado Fresco · Sommerschield (mercados) ---------- */
  {
    id: 'mercado-fresco', name: 'Mercado Fresco', cat: 'mercados', kind: 'Supermercado', bairro: 'Sommerschield', cidade: 'Maputo', emoji: '🛒', grad: ['#3BB273','#147A4A'], rating: 4.6, reviews: 860, prep: 25, min: 500, featured: true, promo: 'Frutas e legumes frescos', desc: 'Mercearia e frescos todos os dias, com entrega rápida.', adult: false,
    sections: [
      { title: 'Mercearia', items: [
        {id: 'sm1', name: 'Arroz agulha', desc: 'Arroz agulha.', price: 480, emoji: '🍚', kg: 5, tag: 'Popular', sizes: [{l: '1 kg', p: 110, kg: 1},{l: '5 kg', p: 480, kg: 5},{l: '25 kg', p: 2150, kg: 25, bulky: true}], def: 1},
        {id: 'sm2', name: 'Farinha de milho branco', desc: 'Para uma boa xima.', price: 360, emoji: '🌽', kg: 5, sizes: [{l: '1 kg', p: 85, kg: 1},{l: '5 kg', p: 360, kg: 5},{l: '10 kg', p: 690, kg: 10},{l: '25 kg', p: 1600, kg: 25, bulky: true}], def: 1},
        {id: 'sm3', name: 'Óleo vegetal', desc: '', price: 185, emoji: '🌻', kg: 1, sizes: [{l: '1 L', p: 185, kg: 1},{l: '2 L', p: 350, kg: 2},{l: '5 L', p: 820, kg: 5}], def: 0},
        {id: 'sm4', name: 'Açúcar castanho', desc: '', price: 165, emoji: '🍬', kg: 2, sizes: [{l: '1 kg', p: 90, kg: 1},{l: '2 kg', p: 165, kg: 2},{l: '5 kg', p: 400, kg: 5}], def: 1},
        {id: 'sm5', name: 'Amendoim torrado', desc: 'Para matapa e caril.', price: 130, emoji: '🥜', kg: 0.5, sizes: [{l: '500 g', p: 130, kg: 0.5},{l: '1 kg', p: 240, kg: 1}], def: 0}
      ] },
      { title: 'Frescos', items: [
        {id: 'sf1', name: 'Pão (6 un.)', desc: 'Pão de padaria, do dia.', price: 60, emoji: '🥖', kg: 0.5, tag: 'Popular'},
        {id: 'sf2', name: 'Ovos (dúzia)', desc: '', price: 190, emoji: '🥚', kg: 0.5},
        {id: 'sf3', name: 'Leite (1 L)', desc: 'UHT meio-gordo.', price: 110, emoji: '🥛', kg: 1.05},
        {id: 'sf4', name: 'Tomate', desc: '', price: 90, emoji: '🍅', kg: 1, unit: 'kg', weights: [0.5,1,2,3,5]},
        {id: 'sf5', name: 'Coco', desc: 'Unidade.', price: 50, emoji: '🥥', kg: 0.5},
        {id: 'sf6', name: 'Bananas', desc: '', price: 70, emoji: '🍌', kg: 1, unit: 'kg', weights: [0.5,1,2,3,5]},
        {id: 'sf7', name: 'Folhas de mandioca (molho)', desc: 'Para matapa.', price: 60, emoji: '🥬', kg: 0.5},
        {id: 'sf8', name: 'Cebola', desc: 'Cebola branca nacional.', price: 70, emoji: '🧅', kg: 1, unit: 'kg', weights: [0.5,1,2,3,5]},
        {id: 'sf9', name: 'Batata reno', desc: 'Boa para fritar ou cozer.', price: 75, emoji: '🥔', kg: 1, unit: 'kg', weights: [0.5,1,2,3,5]}
      ] },
      { title: 'Casa', items: [
        {id: 'sc1', name: 'Sabão em barra', desc: '', price: 45, emoji: '🧼', kg: 0.5},
        {id: 'sc2', name: 'Papel higiénico (4 rolos)', desc: '', price: 120, emoji: '🧻', kg: 0.5}
      ] },
      { title: 'Talho e peixaria', items: [
        {id: 'st1', name: 'Carne de vaca (bife)', desc: 'Cortada na hora.', price: 650, emoji: '🥩', kg: 1, unit: 'kg', weights: [0.5,1,1.5,2]},
        {id: 'st2', name: 'Carne picada', desc: 'Para chamuças e molhos.', price: 560, emoji: '🥩', kg: 1, unit: 'kg', weights: [0.5,1,1.5,2]},
        {id: 'st3', name: 'Peixe serra (posta)', desc: 'Peixe fresco da Costa do Sol.', price: 520, emoji: '🐟', kg: 1, unit: 'kg', weights: [0.5,1,1.5,2]},
        {id: 'st4', name: 'Camarão médio', desc: 'Camarão de Moçambique, fresco.', price: 950, emoji: '🦐', kg: 1, unit: 'kg', weights: [0.5,1,2]}
      ] }
    ]
  },
  /* ---------- Super Matola · Matola Cidade (mercados) ---------- */
  {
    id: 'super-matola', name: 'Super Matola', cat: 'mercados', kind: 'Hipermercado', bairro: 'Matola Cidade', cidade: 'Matola', emoji: '🛍️', grad: ['#7BC043','#2E7D32'], rating: 4.4, reviews: 390, prep: 35, min: 500, featured: false, promo: '', desc: 'Compras grandes a preço de hipermercado. Ideal para carro.', adult: false,
    sections: [
      { title: 'Essenciais', items: [
        {id: 'mt1', name: 'Cabaz básico', desc: 'Arroz 5 kg, óleo 1 L, açúcar 2 kg, farinha 5 kg.', price: 1150, emoji: '🧺', kg: 13, tag: 'Só de carro', bulky: true},
        {id: 'mt2', name: 'Frango congelado (1,5 kg)', desc: '', price: 420, emoji: '🍗', kg: 1.5},
        {id: 'mt3', name: 'Peixe carapau', desc: '', price: 280, emoji: '🐟', kg: 1, unit: 'kg', weights: [0.5,1,1.5,2]},
        {id: 'mt4', name: 'Piri-piri fresco (100 g)', desc: '', price: 50, emoji: '🌶️', kg: 0.5},
        {id: 'mt5', name: 'Leite em pó (2,5 kg)', desc: 'Lata grande para a família.', price: 1250, emoji: '🥛', kg: 2.6},
        {id: 'mt6', name: 'Óleo vegetal', desc: 'Garrafão de óleo de girassol.', price: 690, emoji: '🫗', kg: 5, sizes: [{l: '1 L', p: 175, kg: 1},{l: '5 L', p: 690, kg: 5},{l: '20 L', p: 2500, kg: 20, bulky: true}], def: 1},
        {id: 'mt7', name: 'Feijão nhemba', desc: 'Para badjias e mucapata.', price: 150, emoji: '🫘', kg: 1, sizes: [{l: '500 g', p: 80, kg: 0.5},{l: '1 kg', p: 150, kg: 1},{l: '5 kg', p: 690, kg: 5}], def: 1},
        {id: 'mt8', name: 'Camarão congelado', desc: 'Camarão médio de Moçambique.', price: 850, emoji: '🦐', kg: 1, unit: 'kg', weights: [0.5,1,2]},
        {id: 'mt12', name: 'Carne de vaca (para guisar)', desc: 'Pedaços com osso.', price: 520, emoji: '🥩', kg: 1, unit: 'kg', weights: [0.5,1,1.5,2]},
        {id: 'mt13', name: 'Arroz', desc: 'Arroz de grão longo.', emoji: '🍚', sizes: [{l: '1 kg', p: 105, kg: 1},{l: '5 kg', p: 450, kg: 5},{l: '10 kg', p: 860, kg: 10},{l: '25 kg', p: 2050, kg: 25, bulky: true}], def: 1, price: 450, kg: 5}
      ] },
      { title: 'Casa e limpeza', items: [
        {id: 'mt9', name: 'Detergente em pó (5 kg)', desc: 'Para lavar roupa.', price: 790, emoji: '🧼', kg: 5},
        {id: 'mt10', name: 'Papel higiénico (18 rolos)', desc: 'Folha dupla, pack económico.', price: 480, emoji: '🧻', kg: 2},
        {id: 'mt11', name: 'Carvão vegetal (saco 10 kg)', desc: 'Para o braai.', price: 380, emoji: '🔥', kg: 10, bulky: true}
      ] }
    ]
  },
  /* ---------- Farmácia Saúde+ · Polana Cimento (farmacia) ---------- */
  {
    id: 'farmacia-saude', name: 'Farmácia Saúde+', cat: 'farmacia', kind: 'Farmácia 24 horas', bairro: 'Polana Cimento', cidade: 'Maputo', emoji: '💊', grad: ['#4C9BFF','#1F5FD1'], rating: 4.8, reviews: 655, prep: 15, min: 0, featured: true, promo: 'Aberta 24 horas', desc: 'Farmácia 24 horas. Farmacêutico disponível para validar a sua receita.', adult: false,
    sections: [
      { title: 'Sem receita', items: [
        {id: 'fa1', name: 'Paracetamol 500 mg (20 comp.)', desc: 'Analgésico e antipirético.', price: 85, emoji: '💊', kg: 0.5, tag: 'Popular'},
        {id: 'fa2', name: 'Sais de reidratação oral', desc: 'Saqueta.', price: 40, emoji: '🧂', kg: 0.5},
        {id: 'fa3', name: 'Vitamina C 1000 mg (10 eferv.)', desc: '', price: 260, emoji: '🍊', kg: 0.5},
        {id: 'fa4', name: 'Pensos rápidos (20 un.)', desc: '', price: 120, emoji: '🩹', kg: 0.5},
        {id: 'fa5', name: 'Teste rápido de malária', desc: 'Resultado em 15 minutos. Em caso de positivo, procure um médico.', price: 180, emoji: '🩸', kg: 0.05, tag: 'Essencial'}
      ] },
      { title: 'Proteção', items: [
        {id: 'fp1', name: 'Repelente de mosquitos', desc: 'Spray 100 ml, até 8 horas.', price: 380, emoji: '🦟', kg: 0.5, tag: 'Popular'},
        {id: 'fp2', name: 'Protetor solar FPS 50', desc: '200 ml.', price: 950, emoji: '🧴', kg: 0.5},
        {id: 'fp3', name: 'Termómetro digital', desc: '', price: 450, emoji: '🌡️', kg: 0.5},
        {id: 'fp4', name: 'Rede mosquiteira', desc: 'Tratada com inseticida.', price: 650, emoji: '🛏️', kg: 0.5}
      ] },
      { title: 'Com receita médica', items: [
        {id: 'fr1', name: 'Coartem 20/120 mg (24 comp.)', desc: 'Antimalárico (arteméter + lumefantrina). Venda mediante receita médica.', price: 380, emoji: '💊', kg: 0.05, rx: true},
        {id: 'fr2', name: 'Amoxicilina 500 mg (16 cáps.)', desc: 'Antibiótico. Venda mediante receita médica.', price: 320, emoji: '💊', kg: 0.05, rx: true},
        {id: 'fr3', name: 'Losartan 50 mg (30 comp.)', desc: 'Para a tensão arterial. Requer receita médica.', price: 420, emoji: '💊', kg: 0.05, rx: true}
      ] }
    ]
  },
  /* ---------- Farmácia Central da Baixa · Baixa (farmacia) ---------- */
  {
    id: 'farmacia-baixa', name: 'Farmácia Central da Baixa', cat: 'farmacia', kind: 'Farmácia', bairro: 'Baixa', cidade: 'Maputo', emoji: '⚕️', grad: ['#22C1A4','#0E7C66'], rating: 4.5, reviews: 302, prep: 20, min: 0, featured: false, promo: '', desc: 'Farmácia de confiança na Baixa, desde sempre.', adult: false,
    sections: [
      { title: 'Bem-estar', items: [
        {id: 'fb1', name: 'Ibuprofeno 400 mg (20 comp.)', desc: '', price: 140, emoji: '💊', kg: 0.5},
        {id: 'fb2', name: 'Xarope para a tosse', desc: '150 ml.', price: 320, emoji: '🍯', kg: 0.5},
        {id: 'fb3', name: 'Máscaras cirúrgicas (10 un.)', desc: '', price: 150, emoji: '😷', kg: 0.5},
        {id: 'fb4', name: 'Álcool gel (250 ml)', desc: '', price: 180, emoji: '🧴', kg: 0.5},
        {id: 'fb5', name: 'Sais de reidratação oral (5 saq.)', desc: 'Para prevenir a desidratação.', price: 75, emoji: '💧', kg: 0.1},
        {id: 'fb6', name: 'Repelente roll-on', desc: 'Proteção até 6 horas.', price: 230, emoji: '🦟', kg: 0.1}
      ] },
      { title: 'Com receita médica', items: [
        {id: 'fbr1', name: 'Azitromicina 500 mg (3 comp.)', desc: 'Antibiótico. Requer receita médica.', price: 450, emoji: '💊', kg: 0.05, rx: true},
        {id: 'fbr2', name: 'Metformina 850 mg (60 comp.)', desc: 'Para a diabetes. Requer receita médica.', price: 290, emoji: '💊', kg: 0.05, rx: true}
      ] }
    ]
  },
  /* ---------- Adega do Bairro · Coop (bebidas) ---------- */
  {
    id: 'adega-coop', name: 'Adega do Bairro', cat: 'bebidas', kind: 'Bebidas geladas', bairro: 'Coop', cidade: 'Maputo', emoji: '🍻', grad: ['#FFC531','#E08E0B'], rating: 4.6, reviews: 744, prep: 10, min: 200, featured: true, promo: 'Sempre geladas', desc: 'Cervejas, vinhos e refrescos sempre gelados. Venda proibida a menores de 18 anos.', adult: true,
    sections: [
      { title: 'Cervejas', items: [
        {id: 'ab1', name: 'Cerveja lager nacional (550 ml)', desc: 'Garrafa, estilo clássico de Maputo.', price: 110, emoji: '🍺', kg: 0.5, tag: 'Popular', adult: true},
        {id: 'ab2', name: 'Grade de cerveja lager (24 × 330 ml)', desc: 'Para a festa.', price: 1850, emoji: '📦', kg: 14, tag: 'Popular', adult: true, bulky: true},
        {id: 'ab3', name: 'Cerveja preta (330 ml)', desc: 'Encorpada, tosta e caramelo.', price: 100, emoji: '🍺', kg: 0.5, adult: true}
      ] },
      { title: 'Sem álcool', items: [
        {id: 'as1', name: 'Refrigerante (2 L)', desc: '', price: 140, emoji: '🥤', kg: 2.1},
        {id: 'as2', name: 'Água mineral (1,5 L)', desc: '', price: 65, emoji: '💧', kg: 1.58},
        {id: 'as3', name: 'Água de coco', desc: 'Coco verde fresco.', price: 70, emoji: '🥥', kg: 0.5},
        {id: 'as4', name: 'Sumo natural de manga (1 L)', desc: '', price: 190, emoji: '🥭', kg: 1.05},
        {id: 'as5', name: 'Gelo (2 kg)', desc: '', price: 80, emoji: '🧊', kg: 2}
      ] },
      { title: 'Vinhos', items: [
        {id: 'av1', name: 'Vinho tinto (750 ml)', desc: 'Sul-africano, seco.', price: 650, emoji: '🍷', kg: 0.5, adult: true},
        {id: 'av2', name: 'Vinho verde (750 ml)', desc: 'Fresco e leve.', price: 720, emoji: '🥂', kg: 0.5, adult: true},
        {id: 'av3', name: 'Tentação de caju (licor, 500 ml)', desc: 'Licor artesanal de caju de Inhambane.', price: 540, emoji: '🍶', kg: 0.9, adult: true}
      ] }
    ]
  },
  /* ---------- Beleza Capulana · Polana Cimento (cosmeticos) ---------- */
  {
    id: 'beleza-capulana', name: 'Beleza Capulana', cat: 'cosmeticos', kind: 'Cosmética natural', bairro: 'Polana Cimento', cidade: 'Maputo', emoji: '💄', grad: ['#E86FB0','#9C2C77'], rating: 4.9, reviews: 288, prep: 25, min: 300, featured: true, promo: 'Produtos naturais de Moçambique', desc: 'Cosmética natural feita com ingredientes de Moçambique.', adult: false,
    sections: [
      { title: 'Natural', items: [
        {id: 'bc1', name: 'Óleo de mafurra (100 ml)', desc: 'Óleo tradicional para pele e cabelo.', price: 420, emoji: '🌰', kg: 0.5, tag: 'Popular'},
        {id: 'bc2', name: 'Óleo de coco virgem (250 ml)', desc: 'Prensado a frio, de Inhambane.', price: 320, emoji: '🥥', kg: 0.5},
        {id: 'bc3', name: 'Manteiga de karité', desc: '200 g, pura.', price: 450, emoji: '🧈', kg: 0.5},
        {id: 'bc4', name: 'Sabonete artesanal de mafurra', desc: '', price: 160, emoji: '🧼', kg: 0.5},
        {id: 'bc5', name: 'Máscara facial de mussiro', desc: 'Inspirada na tradição de Nampula.', price: 380, emoji: '🌸', kg: 0.5, tag: 'Popular'}
      ] },
      { title: 'Maquilhagem e cabelo', items: [
        {id: 'bm1', name: 'Batom mate', desc: 'Vários tons.', price: 420, emoji: '💄', kg: 0.5},
        {id: 'bm2', name: 'Creme para caracóis', desc: '300 ml.', price: 520, emoji: '💆🏾‍♀️', kg: 0.5},
        {id: 'bm3', name: 'Perfume floral (50 ml)', desc: '', price: 1800, emoji: '🌺', kg: 0.5}
      ] }
    ]
  },
  /* ---------- Sabores da Zambézia · Polana Cimento (restaurantes) ---------- */
  {
    id: 'sabores-zambezia', name: 'Sabores da Zambézia', cat: 'restaurantes', kind: 'Moçambicana', tags: ['Moçambicana','Caril','Grelhados'], bairro: 'Polana Cimento', cidade: 'Maputo', emoji: '🍛', grad: ['#F59E0B','#B45309'], rating: 4.8, reviews: 1240, prep: 20, min: 200, featured: true, promo: '', desc: 'Cozinha moçambicana tradicional, com receitas de família da Zambézia.', adult: false,
    sections: [
      { title: 'Pratos da casa', items: [
        {id: 'p101', name: 'Frango à zambeziana', price: 650, emoji: '🍗', kg: 0.8, tag: 'Mais pedido', desc: 'Meio frango grelhado no carvão, regado com molho de leite de coco, alho e piri-piri.', opts: [{name: 'Acompanhamento', type: 'one', choices: [{l: 'Xima', p: 0},{l: 'Arroz branco', p: 0},{l: 'Arroz de coco', p: 40},{l: 'Batata frita', p: 30}]},{name: 'Picante', type: 'one', choices: [{l: 'Suave', p: 0},{l: 'Médio', p: 0},{l: 'Piri-piri forte 🌶️', p: 0}]}]},
        {id: 'p102', name: 'Matapa com camarão', price: 480, emoji: '🥬', kg: 0.6, tag: 'Tradicional', desc: 'Folhas de mandioca piladas, cozinhadas lentamente com amendoim, coco e camarão. Servida com arroz.', opts: [{name: 'Acompanhamento', type: 'one', choices: [{l: 'Xima', p: 0},{l: 'Arroz branco', p: 0},{l: 'Arroz de coco', p: 40},{l: 'Batata frita', p: 30}]}]},
        {id: 'p103', name: 'Caril de amendoim com frango', price: 520, emoji: '🍛', kg: 0.6, desc: 'Frango cozinhado em molho cremoso de amendoim torrado e especiarias.', opts: [{name: 'Acompanhamento', type: 'one', choices: [{l: 'Xima', p: 0},{l: 'Arroz branco', p: 0},{l: 'Arroz de coco', p: 40},{l: 'Batata frita', p: 30}]},{name: 'Picante', type: 'one', choices: [{l: 'Suave', p: 0},{l: 'Médio', p: 0},{l: 'Piri-piri forte 🌶️', p: 0}]}]},
        {id: 'p104', name: 'Galinha cafreal', price: 690, emoji: '🍗', kg: 0.8, desc: 'Galinha do campo marinada em limão, alho e piri-piri, grelhada lentamente.', opts: [{name: 'Acompanhamento', type: 'one', choices: [{l: 'Xima', p: 0},{l: 'Arroz branco', p: 0},{l: 'Arroz de coco', p: 40},{l: 'Batata frita', p: 30}]},{name: 'Picante', type: 'one', choices: [{l: 'Suave', p: 0},{l: 'Médio', p: 0},{l: 'Piri-piri forte 🌶️', p: 0}]}]},
        {id: 'p105', name: 'Xima com caril de peixe', price: 450, emoji: '🐟', kg: 0.7, desc: 'Peixe fresco em caril de tomate e coco, com xima de milho branco.'},
        {id: 'p106', name: 'Mucapata', price: 260, emoji: '🍚', kg: 0.5, desc: 'Arroz cozinhado com feijão-nhemba e leite de coco, prato típico da Zambézia.'}
      ] },
      { title: 'Acompanhamentos', items: [
        {id: 'p107', name: 'Xima (porção)', price: 80, emoji: '🍚', kg: 0.3, desc: 'Papa firme de farinha de milho branco.'},
        {id: 'p108', name: 'Arroz de coco', price: 120, emoji: '🥥', kg: 0.3, desc: 'Arroz soltinho cozido em leite de coco.'},
        {id: 'p109', name: 'Salada de tomate e cebola', price: 90, emoji: '🥗', kg: 0.2, desc: 'Tomate, cebola e coentros com limão.'}
      ] },
      { title: 'Bebidas', items: [
        {id: 'p110', name: 'Sumo natural de maçala', price: 120, emoji: '🧃', kg: 0.4, desc: 'Sumo fresco de maçala, fruto tradicional moçambicano.'},
        {id: 'p111', name: 'Refrigerante lata 330 ml', price: 70, emoji: '🥤', kg: 0.35, desc: 'Gelado. Sabores variados.'},
        {id: 'p112', name: 'Água mineral 500 ml', price: 40, emoji: '💧', kg: 0.5, desc: 'Água mineral natural.'}
      ] }
    ]
  },
  /* ---------- Prego da Baixa · Baixa (restaurantes) ---------- */
  {
    id: 'prego-baixa', name: 'Prego da Baixa', cat: 'restaurantes', kind: 'Pregos', tags: ['Pregos','Petiscos','Salgados'], bairro: 'Baixa', cidade: 'Maputo', emoji: '🥖', grad: ['#EF4444','#991B1B'], rating: 4.7, reviews: 2310, prep: 15, min: 200, featured: true, promo: '', desc: 'Pregos, chamuças e petiscos na Baixa desde 1998. Rápido e saboroso.', adult: false,
    sections: [
      { title: 'Pregos', items: [
        {id: 'p201', name: 'Prego no pão', price: 250, emoji: '🥖', kg: 0.35, tag: 'Mais pedido', desc: 'Bife tenro de vaca com alho e piri-piri, em pão fresco estaladiço.', opts: [{name: 'Extras', type: 'multi', choices: [{l: 'Ovo estrelado', p: 30},{l: 'Queijo', p: 40},{l: 'Fiambre', p: 40}]},{name: 'Picante', type: 'one', choices: [{l: 'Suave', p: 0},{l: 'Médio', p: 0},{l: 'Piri-piri forte 🌶️', p: 0}]}]},
        {id: 'p202', name: 'Prego no prato', price: 450, emoji: '🍳', kg: 0.6, desc: 'Bife com ovo estrelado, batata frita e salada.'},
        {id: 'p203', name: 'Pão com chouriço', price: 150, emoji: '🌭', kg: 0.3, desc: 'Pão quente com chouriço assado.'}
      ] },
      { title: 'Salgados e petiscos', items: [
        {id: 'p204', name: 'Chamuças de carne (6 un.)', price: 180, emoji: '🥟', kg: 0.3, tag: 'Popular', desc: 'Triângulos estaladiços recheados com carne picada e especiarias.'},
        {id: 'p205', name: 'Chamuças de vegetais (6 un.)', price: 160, emoji: '🥟', kg: 0.3, desc: 'Recheio de batata, ervilhas e caril.'},
        {id: 'p206', name: 'Badjias (10 un.)', price: 120, emoji: '🧆', kg: 0.25, desc: 'Bolinhos fritos de feijão-nhemba, com cebola e piri-piri. Perfeitos com pão.'},
        {id: 'p207', name: 'Rissóis de camarão (6 un.)', price: 210, emoji: '🍤', kg: 0.3, desc: 'Massa fina e recheio cremoso de camarão.'},
        {id: 'p208', name: 'Batata frita', price: 120, emoji: '🍟', kg: 0.3, desc: 'Porção média, estaladiça.'}
      ] },
      { title: 'Bebidas', items: [
        {id: 'p209', name: 'Galão', price: 80, emoji: '☕', kg: 0.3, desc: 'Café com leite em copo alto.'},
        {id: 'p210', name: 'Sumo de caju', price: 100, emoji: '🧃', kg: 0.4, desc: 'Sumo natural de caju fresco.'}
      ] }
    ]
  },
  /* ---------- Marisqueira Ponta Vermelha · Polana Cimento (restaurantes) ---------- */
  {
    id: 'mare-alta-catembe', name: 'Marisqueira Ponta Vermelha', cat: 'restaurantes', kind: 'Marisco', tags: ['Marisco','Peixe','Vista mar'], bairro: 'Polana Cimento', cidade: 'Maputo', emoji: '🦐', grad: ['#06B6D4','#0E7490'], rating: 4.9, reviews: 860, prep: 30, min: 200, featured: false, promo: '', desc: 'Marisco fresco à beira-mar, do pescador para a sua mesa.', adult: false,
    sections: [
      { title: 'Marisco', items: [
        {id: 'p301', name: 'Camarão grelhado com piri-piri', price: 1450, emoji: '🦐', kg: 0.7, tag: 'Especialidade', desc: 'Camarão de Moçambique grelhado com manteiga de alho e piri-piri. Com batata frita ou arroz.', opts: [{name: 'Quantidade', type: 'one', choices: [{l: '500 g', p: 0},{l: '1 kg', p: 1300}]},{name: 'Picante', type: 'one', choices: [{l: 'Suave', p: 0},{l: 'Médio', p: 0},{l: 'Piri-piri forte 🌶️', p: 0}]}]},
        {id: 'p302', name: 'Caril de caranguejo', price: 1100, emoji: '🦀', kg: 0.8, desc: 'Caranguejo de mangal em caril de coco, com arroz.'},
        {id: 'p303', name: 'Lulas grelhadas', price: 850, emoji: '🦑', kg: 0.6, desc: 'Lulas frescas grelhadas com limão e salsa.'},
        {id: 'p304', name: 'Arroz de marisco (2 pessoas)', price: 1650, emoji: '🥘', kg: 1.2, desc: 'Arroz malandrinho com camarão, amêijoa e lulas.'},
        {id: 'p305', name: 'Amêijoas com alho e coentros', price: 700, emoji: '🐚', kg: 0.5, desc: 'Amêijoas salteadas em azeite, alho e coentros.'}
      ] },
      { title: 'Peixe', items: [
        {id: 'p306', name: 'Peixe pedra grelhado', price: 950, emoji: '🐟', kg: 0.8, desc: 'Peixe do dia grelhado inteiro, com legumes.'},
        {id: 'p307', name: 'Pão de alho', price: 100, emoji: '🧄', kg: 0.2, desc: 'Pão torrado com manteiga de alho.'},
        {id: 'p308', name: 'Salada mista', price: 150, emoji: '🥗', kg: 0.25, desc: 'Alface, tomate, cebola e pepino.'}
      ] }
    ]
  },
  /* ---------- Tia Rosa Petiscos · Matola Cidade (restaurantes) ---------- */
  {
    id: 'tia-rosa', name: 'Tia Rosa Petiscos', cat: 'restaurantes', kind: 'Caseiro', tags: ['Caseiro','Frango','Petiscos'], bairro: 'Matola Cidade', cidade: 'Matola', emoji: '🍢', grad: ['#A855F7','#6B21A8'], rating: 4.6, reviews: 540, prep: 25, min: 200, featured: false, promo: '', desc: 'Sabores caseiros da Matola. Frango assado no carvão e petiscos para partilhar.', adult: false,
    sections: [
      { title: 'Grelhados', items: [
        {id: 'p401', name: 'Frango assado com piri-piri (inteiro)', price: 950, emoji: '🍗', kg: 1.4, tag: 'Para partilhar', desc: 'Frango inteiro assado no carvão com o piri-piri da Tia Rosa.', opts: [{name: 'Picante', type: 'one', choices: [{l: 'Suave', p: 0},{l: 'Médio', p: 0},{l: 'Piri-piri forte 🌶️', p: 0}]}]},
        {id: 'p402', name: 'Meio frango assado', price: 520, emoji: '🍗', kg: 0.7, desc: 'Com batata frita ou xima.', opts: [{name: 'Acompanhamento', type: 'one', choices: [{l: 'Xima', p: 0},{l: 'Arroz branco', p: 0},{l: 'Arroz de coco', p: 40},{l: 'Batata frita', p: 30}]},{name: 'Picante', type: 'one', choices: [{l: 'Suave', p: 0},{l: 'Médio', p: 0},{l: 'Piri-piri forte 🌶️', p: 0}]}]},
        {id: 'p403', name: 'Espetada de carne', price: 380, emoji: '🍢', kg: 0.4, desc: 'Espetada de vaca marinada, com pão.'},
        {id: 'p404', name: 'Feijoada à moçambicana', price: 420, emoji: '🍲', kg: 0.6, desc: 'Feijão manteiga com carnes e chouriço, com arroz.'},
        {id: 'p405', name: 'Xima com matapa', price: 300, emoji: '🌿', kg: 0.6, desc: 'Combinação clássica e reconfortante.'}
      ] },
      { title: 'Petiscos', items: [
        {id: 'p406', name: 'Chamuças mistas (12 un.)', price: 330, emoji: '🥟', kg: 0.6, desc: 'Carne e vegetais, acabadas de fritar.'},
        {id: 'p407', name: 'Badjias (20 un.)', price: 220, emoji: '🧆', kg: 0.5, desc: 'Bolinhos de feijão-nhemba.'},
        {id: 'p408', name: 'Cocada (6 un.)', price: 120, emoji: '🥥', kg: 0.2, desc: 'Doce tradicional de coco ralado.'}
      ] }
    ]
  },
  /* ---------- Pizzaria Sommer · Sommerschield (restaurantes) ---------- */
  {
    id: 'pizzaria-sommer', name: 'Pizzaria Sommer', cat: 'restaurantes', kind: 'Pizza', tags: ['Pizza','Hambúrgueres'], bairro: 'Sommerschield', cidade: 'Maputo', emoji: '🍕', grad: ['#22C55E','#15803D'], rating: 4.5, reviews: 980, prep: 25, min: 200, featured: false, promo: '2.ª pizza a metade do preço', desc: 'Pizzas em forno a lenha e hambúrgueres artesanais.', adult: false,
    sections: [
      { title: 'Pizzas', items: [
        {id: 'p501', name: 'Pizza Piri-piri Frango', price: 650, emoji: '🍕', kg: 0.8, tag: 'Favorita', desc: 'Frango desfiado, pimento, cebola roxa e piri-piri da casa.', opts: [{name: 'Tamanho', type: 'one', choices: [{l: 'Média (30 cm)', p: 0},{l: 'Grande (40 cm)', p: 220}]}]},
        {id: 'p502', name: 'Pizza Margherita', price: 520, emoji: '🍕', kg: 0.7, desc: 'Tomate, mozzarella e manjericão.', opts: [{name: 'Tamanho', type: 'one', choices: [{l: 'Média (30 cm)', p: 0},{l: 'Grande (40 cm)', p: 200}]}]},
        {id: 'p503', name: 'Pizza do Mar', price: 790, emoji: '🍕', kg: 0.8, desc: 'Camarão, lulas, alho e coentros.'}
      ] },
      { title: 'Hambúrgueres', items: [
        {id: 'p504', name: 'Hambúrguer clássico', price: 420, emoji: '🍔', kg: 0.45, desc: 'Carne de vaca 180 g, queijo, alface e tomate. Com batata.'},
        {id: 'p505', name: 'Hambúrguer de camarão', price: 520, emoji: '🍔', kg: 0.45, desc: 'Hambúrguer de camarão com maionese de lima.'},
        {id: 'p506', name: 'Gelado de manga', price: 150, emoji: '🍨', kg: 0.2, desc: 'Feito com mangas de Moçambique.'}
      ] }
    ]
  },
  /* ---------- Banca Verde · Costa do Sol (mercados) ---------- */
  {
    id: 'banca-verde', name: 'Banca Verde', cat: 'mercados', kind: 'Frutas', tags: ['Frutas','Legumes','Peixe fresco'], bairro: 'Costa do Sol', cidade: 'Maputo', emoji: '🥬', grad: ['#84CC16','#3F6212'], rating: 4.7, reviews: 690, prep: 15, min: 300, featured: false, promo: '', desc: 'Frutas, legumes e peixe fresco, escolhidos todas as manhãs no mercado.', adult: false,
    sections: [
      { title: 'Frutas', items: [
        {id: 'p601', name: 'Manga', price: 90, emoji: '🥭', kg: 1, tag: 'Época', desc: 'Mangas doces e maduras.', unit: 'kg', weights: [0.5,1,2,3,5]},
        {id: 'p602', name: 'Banana (cacho ~1 kg)', price: 60, emoji: '🍌', kg: 1, desc: 'Banana-maçã da Manhiça.'},
        {id: 'p603', name: 'Ananás', price: 80, emoji: '🍍', kg: 1.2, desc: 'Ananás doce e sumarento.'},
        {id: 'p604', name: 'Coco', price: 50, emoji: '🥥', kg: 0.8, desc: 'Coco seco, ideal para leite de coco.'},
        {id: 'p605', name: 'Laranja', price: 80, emoji: '🍊', kg: 1, desc: 'Laranjas para sumo.', unit: 'kg', weights: [0.5,1,2,3,5]},
        {id: 'p606', name: 'Papaia', price: 70, emoji: '🍈', kg: 1, desc: 'Papaia madura.'}
      ] },
      { title: 'Legumes e verduras', items: [
        {id: 'p607', name: 'Tomate', price: 80, emoji: '🍅', kg: 1, desc: 'Tomate maduro.', unit: 'kg', weights: [0.5,1,2,3,5]},
        {id: 'p608', name: 'Cebola', price: 70, emoji: '🧅', kg: 1, desc: 'Cebola branca.', unit: 'kg', weights: [0.5,1,2,3,5]},
        {id: 'p609', name: 'Folhas de mandioca para matapa', price: 40, emoji: '🌿', kg: 0.5, tag: 'Tradicional', desc: 'Molho fresco, já pilado se preferir.', opts: [{name: 'Preparação', type: 'one', choices: [{l: 'Inteiras', p: 0},{l: 'Já piladas', p: 20}]}]},
        {id: 'p610', name: 'Mandioca', price: 50, emoji: '🍠', kg: 1, desc: 'Mandioca fresca descascada.', unit: 'kg', weights: [0.5,1,2,3,5]},
        {id: 'p611', name: 'Couve (molho)', price: 30, emoji: '🥬', kg: 0.4, desc: 'Couve fresca.'},
        {id: 'p612', name: 'Piri-piri fresco (100 g)', price: 30, emoji: '🌶️', kg: 0.1, desc: 'Bem picante!'},
        {id: 'p613', name: 'Alho (250 g)', price: 60, emoji: '🧄', kg: 0.25, desc: 'Alho seco.'},
        {id: 'p617', name: 'Batata doce', desc: 'Da Manhiça.', price: 60, emoji: '🍠', kg: 1, unit: 'kg', weights: [0.5,1,2,3,5]}
      ] },
      { title: 'Peixe e carne', items: [
        {id: 'p614', name: 'Camarão fresco', price: 900, emoji: '🦐', kg: 1, desc: 'Camarão médio, limpo a pedido.', unit: 'kg', weights: [0.5,1,2]},
        {id: 'p615', name: 'Carapau', price: 280, emoji: '🐟', kg: 1, desc: 'Carapau fresco.', unit: 'kg', weights: [0.5,1,1.5,2]},
        {id: 'p616', name: 'Frango inteiro (~1,5 kg)', price: 420, emoji: '🐔', kg: 1.5, desc: 'Frango fresco.'},
        {id: 'p618', name: 'Carne de cabrito', desc: 'Para caril de cabrito.', price: 720, emoji: '🥩', kg: 1, unit: 'kg', weights: [0.5,1,1.5,2]}
      ] }
    ]
  },
  /* ---------- SuperPoupa Matola · Matola Cidade (mercados) ---------- */
  {
    id: 'superpoupa', name: 'SuperPoupa Matola', cat: 'mercados', kind: 'Supermercado', tags: ['Supermercado','Mercearia','Grosso'], bairro: 'Matola Cidade', cidade: 'Matola', emoji: '🛒', grad: ['#0EA5E9','#1E40AF'], rating: 4.4, reviews: 1530, prep: 20, min: 300, featured: false, promo: 'Preços de grossista', desc: 'O supermercado do bairro, com preços de grossista. Ideal para as compras do mês.', adult: false,
    sections: [
      { title: 'Mercearia', items: [
        {id: 'p701', name: 'Farinha de milho branco', price: 560, emoji: '🌽', kg: 10, tag: 'Compra do mês', desc: 'Farinha de milho branco para xima.', sizes: [{l: '1 kg', p: 80, kg: 1},{l: '5 kg', p: 320, kg: 5},{l: '10 kg', p: 560, kg: 10},{l: '25 kg', p: 1350, kg: 25, bulky: true}], def: 2},
        {id: 'p702', name: 'Arroz agulha', price: 450, emoji: '🍚', kg: 5, desc: 'Arroz agulha de grão longo.', sizes: [{l: '1 kg', p: 100, kg: 1},{l: '5 kg', p: 450, kg: 5},{l: '10 kg', p: 870, kg: 10},{l: '25 kg', p: 2050, kg: 25, bulky: true}], def: 1},
        {id: 'p703', name: 'Óleo vegetal', price: 680, emoji: '🫗', kg: 5, desc: 'Óleo de girassol.', sizes: [{l: '1 L', p: 170, kg: 1},{l: '5 L', p: 680, kg: 5},{l: '20 L', p: 2450, kg: 20, bulky: true}], def: 1},
        {id: 'p704', name: 'Açúcar castanho', price: 170, emoji: '🍬', kg: 2, desc: 'Açúcar nacional.', sizes: [{l: '1 kg', p: 88, kg: 1},{l: '2 kg', p: 170, kg: 2},{l: '5 kg', p: 395, kg: 5}], def: 1},
        {id: 'p705', name: 'Feijão manteiga', price: 160, emoji: '🫘', kg: 1, desc: 'Feijão seco.', sizes: [{l: '500 g', p: 85, kg: 0.5},{l: '1 kg', p: 160, kg: 1},{l: '5 kg', p: 750, kg: 5}], def: 1},
        {id: 'p706', name: 'Amendoim cru', price: 220, emoji: '🥜', kg: 1, desc: 'Amendoim cru, para caril e matapa.', sizes: [{l: '500 g', p: 115, kg: 0.5},{l: '1 kg', p: 220, kg: 1}], def: 1},
        {id: 'p707', name: 'Esparguete (500 g)', price: 70, emoji: '🍝', kg: 0.5, desc: 'Massa de trigo.'},
        {id: 'p708', name: 'Atum em lata', price: 120, emoji: '🐟', kg: 0.2, desc: 'Atum em óleo vegetal.'},
        {id: 'p709', name: 'Sal (1 kg)', price: 40, emoji: '🧂', kg: 1, desc: 'Sal marinho iodado.'}
      ] },
      { title: 'Lacticínios e padaria', items: [
        {id: 'p710', name: 'Leite UHT (1 L)', price: 95, emoji: '🥛', kg: 1, desc: 'Leite meio-gordo.'},
        {id: 'p711', name: 'Ovos (30 un.)', price: 420, emoji: '🥚', kg: 1.9, desc: 'Ovos frescos de galinha.'},
        {id: 'p712', name: 'Pão (6 un.)', price: 60, emoji: '🍞', kg: 0.4, desc: 'Pão fresco do dia.'}
      ] },
      { title: 'Águas e sumos', items: [
        {id: 'p713', name: 'Água mineral (fardo 6 x 1,5 L)', price: 280, emoji: '💧', kg: 9, desc: 'Fardo de 6 garrafas.'},
        {id: 'p714', name: 'Sumo de fruta (1 L)', price: 140, emoji: '🧃', kg: 1, desc: 'Manga, laranja ou ananás.'}
      ] }
    ]
  },
  /* ---------- Farmácia Costa do Sol · Costa do Sol (farmacia) ---------- */
  {
    id: 'farmacia-polana', name: 'Farmácia Costa do Sol', cat: 'farmacia', kind: '24 horas', tags: ['24 horas','Medicamentos','Saúde'], bairro: 'Costa do Sol', cidade: 'Maputo', emoji: '💊', grad: ['#10B981','#047857'], rating: 4.8, reviews: 720, prep: 10, min: 0, featured: false, promo: '', desc: 'Aberta 24 horas. Farmacêutico disponível para validar a sua receita.', adult: false,
    sections: [
      { title: 'Sem receita', items: [
        {id: 'p801', name: 'Paracetamol 500 mg (20 comp.)', price: 80, emoji: '💊', kg: 0.05, desc: 'Analgésico e antipirético. Leia o folheto informativo.'},
        {id: 'p802', name: 'Ibuprofeno 400 mg (20 comp.)', price: 150, emoji: '💊', kg: 0.05, desc: 'Anti-inflamatório. Tomar após as refeições.'},
        {id: 'p803', name: 'Sais de reidratação oral (5 saq.)', price: 75, emoji: '💧', kg: 0.1, desc: 'Para prevenir a desidratação.'},
        {id: 'p804', name: 'Teste rápido de malária', price: 180, emoji: '🩸', kg: 0.05, tag: 'Essencial', desc: 'Resultado em 15 minutos. Em caso de positivo, procure um médico.'},
        {id: 'p805', name: 'Repelente de mosquitos', price: 250, emoji: '🦟', kg: 0.15, desc: 'Proteção até 8 horas.'},
        {id: 'p806', name: 'Rede mosquiteira tratada', price: 650, emoji: '🛏️', kg: 0.6, desc: 'Rede de casal impregnada com inseticida.'},
        {id: 'p807', name: 'Vitamina C efervescente', price: 220, emoji: '🍊', kg: 0.1, desc: '20 comprimidos efervescentes.'},
        {id: 'p808', name: 'Xarope para a tosse', price: 280, emoji: '🍯', kg: 0.25, desc: 'Xarope com mel e plantas.'},
        {id: 'p809', name: 'Termómetro digital', price: 450, emoji: '🌡️', kg: 0.05, desc: 'Leitura em 10 segundos.'}
      ] },
      { title: 'Com receita médica', items: [
        {id: 'p810', name: 'Amoxicilina 500 mg (16 cáps.)', price: 320, emoji: '💊', kg: 0.05, rx: true, desc: 'Antibiótico. Venda apenas mediante receita médica.'},
        {id: 'p811', name: 'Antimalárico Artemeter + Lumefantrina', price: 380, emoji: '💊', kg: 0.05, rx: true, desc: 'Tratamento da malária (24 comp.). Requer receita médica.'},
        {id: 'p812', name: 'Losartan 50 mg (30 comp.)', price: 420, emoji: '💊', kg: 0.05, rx: true, desc: 'Para a tensão arterial. Requer receita médica.'},
        {id: 'p813', name: 'Salbutamol inalador', price: 520, emoji: '🫁', kg: 0.1, rx: true, desc: 'Broncodilatador. Requer receita médica.'}
      ] }
    ]
  },
  /* ---------- Farmácia Vida · Baixa (farmacia) ---------- */
  {
    id: 'farmacia-vida', name: 'Farmácia Vida', cat: 'farmacia', kind: 'Bebé', tags: ['Bebé','Higiene','Medicamentos'], bairro: 'Baixa', cidade: 'Maputo', emoji: '🏥', grad: ['#3B82F6','#1D4ED8'], rating: 4.6, reviews: 410, prep: 10, min: 0, featured: false, promo: '', desc: 'Farmácia de bairro com tudo para o bebé e para a família.', adult: false,
    sections: [
      { title: 'Bebé e mamã', items: [
        {id: 'p901', name: 'Fraldas tamanho 3 (40 un.)', price: 850, emoji: '🍼', kg: 1.5, desc: '4–9 kg, absorção prolongada.'},
        {id: 'p902', name: 'Paracetamol xarope infantil', price: 180, emoji: '🧸', kg: 0.2, desc: 'Para crianças. Consulte a posologia.'},
        {id: 'p903', name: 'Pomada para assaduras', price: 220, emoji: '🧴', kg: 0.1, desc: 'Protege a pele do bebé.'}
      ] },
      { title: 'Medicamentos', items: [
        {id: 'p904', name: 'Amoxicilina suspensão oral', price: 290, emoji: '💊', kg: 0.2, rx: true, desc: 'Antibiótico pediátrico. Requer receita médica.'},
        {id: 'p905', name: 'Metformina 850 mg (60 comp.)', price: 290, emoji: '💊', kg: 0.05, rx: true, desc: 'Para a diabetes. Requer receita médica.'},
        {id: 'p906', name: 'Gel desinfetante (500 ml)', price: 150, emoji: '🧼', kg: 0.5, desc: 'Álcool a 70%.'},
        {id: 'p907', name: 'Kit de primeiros socorros', price: 750, emoji: '🩹', kg: 0.5, desc: 'Pensos, gaze, desinfetante e tesoura.'}
      ] }
    ]
  },
  /* ---------- Garrafeira da Polana · Polana Cimento (bebidas) ---------- */
  {
    id: 'garrafeira-polana', name: 'Garrafeira da Polana', cat: 'bebidas', kind: 'Cerveja', tags: ['Cerveja','Vinhos','Gelo'], bairro: 'Polana Cimento', cidade: 'Maputo', emoji: '🍷', grad: ['#E11D48','#881337'], rating: 4.7, reviews: 650, prep: 10, min: 300, featured: false, promo: 'Gelo grátis acima de 1.000 MT', desc: 'Cervejas bem geladas, vinhos e destilados. Venda proibida a menores de 18 anos.', adult: true,
    sections: [
      { title: 'Cervejas', items: [
        {id: 'p1001', name: 'Cerveja lager nacional 550 ml', price: 90, emoji: '🍺', kg: 0.9, adult: true, tag: 'Gelada', desc: 'Cerveja loura moçambicana, servida gelada.'},
        {id: 'p1002', name: 'Grade de cerveja (24 x 330 ml)', price: 1450, emoji: '🍻', kg: 14, adult: true, bulky: true, desc: 'Grade completa. Inclui vasilhame.'},
        {id: 'p1003', name: 'Cerveja preta 340 ml', price: 85, emoji: '🍺', kg: 0.6, adult: true, desc: 'Cerveja escura, encorpada.'},
        {id: 'p1004', name: 'Sidra 330 ml', price: 110, emoji: '🍏', kg: 0.5, adult: true, desc: 'Sidra de maçã.'}
      ] },
      { title: 'Vinhos e destilados', items: [
        {id: 'p1005', name: 'Vinho tinto 750 ml', price: 650, emoji: '🍷', kg: 1.3, adult: true, desc: 'Tinto português, frutado.'},
        {id: 'p1006', name: 'Vinho verde 750 ml', price: 550, emoji: '🍾', kg: 1.3, adult: true, desc: 'Fresco e leve.'},
        {id: 'p1007', name: 'Espumante 750 ml', price: 950, emoji: '🥂', kg: 1.4, adult: true, desc: 'Para celebrar.'},
        {id: 'p1008', name: 'Gin 750 ml', price: 1200, emoji: '🍸', kg: 1.3, adult: true, desc: 'Gin seco.'},
        {id: 'p1009', name: 'Whisky 750 ml', price: 1650, emoji: '🥃', kg: 1.3, adult: true, desc: 'Whisky velho 12 anos.'}
      ] },
      { title: 'Sem álcool', items: [
        {id: 'p1010', name: 'Gelo (saco 2 kg)', price: 80, emoji: '🧊', kg: 2, desc: 'Gelo em cubos.'},
        {id: 'p1011', name: 'Refrigerante 2 L', price: 150, emoji: '🥤', kg: 2.1, desc: 'Cola, laranja ou limão.'},
        {id: 'p1012', name: 'Água tónica 330 ml', price: 70, emoji: '🫧', kg: 0.35, desc: 'Para o gin.'}
      ] }
    ]
  },
  /* ---------- Depósito Bebidas Matola · Machava (bebidas) ---------- */
  {
    id: 'deposito-matola', name: 'Depósito Bebidas Matola', cat: 'bebidas', kind: 'Grosso', tags: ['Grosso','Festas','Carvão'], bairro: 'Machava', cidade: 'Matola', emoji: '🍻', grad: ['#F97316','#9A3412'], rating: 4.5, reviews: 380, prep: 15, min: 300, featured: false, promo: '', desc: 'Bebidas por grosso para festas e braais. Entregas de carro para encomendas grandes.', adult: true,
    sections: [
      { title: 'Para a festa', items: [
        {id: 'p1101', name: 'Grade de cerveja (24 x 550 ml)', price: 1950, emoji: '🍻', kg: 22, adult: true, bulky: true, tag: 'Festa', desc: 'Grade grande. Inclui vasilhame.'},
        {id: 'p1102', name: 'Fardo de refrigerante (24 latas)', price: 1300, emoji: '🥤', kg: 9, bulky: true, desc: 'Sabores sortidos.'},
        {id: 'p1103', name: 'Água mineral (fardo 6 x 1,5 L)', price: 260, emoji: '💧', kg: 9, desc: 'Fardo de 6 garrafas.'},
        {id: 'p1104', name: 'Carvão vegetal (saco 5 kg)', price: 200, emoji: '🔥', kg: 5, desc: 'Para o braai de domingo.'},
        {id: 'p1105', name: 'Gelo (saco 5 kg)', price: 160, emoji: '🧊', kg: 5, desc: 'Gelo em cubos.'}
      ] }
    ]
  },
  /* ---------- Casa Limpa · Alto Maé (casa) ---------- */
  {
    id: 'casa-limpa', name: 'Casa Limpa', cat: 'casa', kind: 'Limpeza', tags: ['Limpeza','Higiene','Mercearia'], bairro: 'Alto Maé', cidade: 'Maputo', emoji: '🧺', grad: ['#8B5CF6','#5B21B6'], rating: 4.6, reviews: 890, prep: 15, min: 300, featured: true, promo: 'Compras do mês? Escolha carro', desc: 'Tudo para a casa: limpeza, higiene e mercearia em quantidade. Entregamos de carro.', adult: false,
    sections: [
      { title: 'Limpeza', items: [
        {id: 'p1201', name: 'Detergente em pó', price: 380, emoji: '🧼', kg: 2, desc: 'Para lavar roupa à mão e à máquina.', sizes: [{l: '500 g', p: 110, kg: 0.5},{l: '2 kg', p: 380, kg: 2},{l: '5 kg', p: 850, kg: 5}], def: 1},
        {id: 'p1202', name: 'Lixívia', price: 120, emoji: '🧴', kg: 2, desc: 'Desinfeta e branqueia.', sizes: [{l: '1 L', p: 70, kg: 1},{l: '2 L', p: 120, kg: 2},{l: '5 L', p: 260, kg: 5}], def: 1},
        {id: 'p1203', name: 'Sabão em barra (pack 5)', price: 180, emoji: '🧼', kg: 1, desc: 'Sabão azul tradicional.'},
        {id: 'p1204', name: 'Detergente da loiça (750 ml)', price: 130, emoji: '🍽️', kg: 0.8, desc: 'Aroma a limão.'},
        {id: 'p1205', name: 'Inseticida spray', price: 280, emoji: '🦟', kg: 0.4, desc: 'Contra mosquitos e baratas.'},
        {id: 'p1206', name: 'Vassoura', price: 250, emoji: '🧹', kg: 0.6, bulky: true, desc: 'Vassoura de cabo comprido.'},
        {id: 'p1207', name: 'Balde com esfregona', price: 650, emoji: '🪣', kg: 1.8, bulky: true, desc: 'Conjunto completo.'}
      ] },
      { title: 'Higiene', items: [
        {id: 'p1208', name: 'Papel higiénico (12 rolos)', price: 320, emoji: '🧻', kg: 1.4, desc: 'Folha dupla.'},
        {id: 'p1209', name: 'Pasta de dentes', price: 95, emoji: '🪥', kg: 0.15, desc: 'Com flúor.'},
        {id: 'p1210', name: 'Sabonete (pack 4)', price: 140, emoji: '🫧', kg: 0.5, desc: 'Sabonete hidratante.'},
        {id: 'p1211', name: 'Champô (400 ml)', price: 240, emoji: '🧴', kg: 0.45, desc: 'Para todos os tipos de cabelo.'}
      ] },
      { title: 'Mercearia (compras do mês)', items: [
        {id: 'p1212', name: 'Farinha de milho branco', price: 1350, emoji: '🌽', kg: 25, desc: 'Saco grande para a família.', sizes: [{l: '5 kg', p: 340, kg: 5},{l: '10 kg', p: 650, kg: 10},{l: '25 kg', p: 1350, kg: 25, bulky: true}], def: 2},
        {id: 'p1213', name: 'Arroz de grão longo', price: 880, emoji: '🍚', kg: 10, desc: 'Arroz de grão longo.', sizes: [{l: '1 kg', p: 105, kg: 1},{l: '5 kg', p: 460, kg: 5},{l: '10 kg', p: 880, kg: 10},{l: '25 kg', p: 2100, kg: 25, bulky: true}], def: 2},
        {id: 'p1214', name: 'Açúcar castanho', price: 410, emoji: '🍬', kg: 5, desc: 'Açúcar castanho nacional.', sizes: [{l: '1 kg', p: 90, kg: 1},{l: '2 kg', p: 170, kg: 2},{l: '5 kg', p: 410, kg: 5}], def: 2},
        {id: 'p1215', name: 'Recarga de gás (botija 11 kg)', price: 1250, emoji: '🔥', kg: 20, bulky: true, tag: 'Só de carro', desc: 'Troca da botija vazia por uma cheia.'},
        {id: 'p1216', name: 'Óleo vegetal', desc: 'Óleo de girassol.', emoji: '🫗', sizes: [{l: '1 L', p: 180, kg: 1},{l: '5 L', p: 700, kg: 5},{l: '20 L', p: 2500, kg: 20, bulky: true}], def: 1, price: 700, kg: 5}
      ] }
    ]
  },
  /* ---------- Beleza Kanimambo · Sommerschield (cosmeticos) ---------- */
  {
    id: 'beleza-kanimambo', name: 'Beleza Kanimambo', cat: 'cosmeticos', kind: 'Natural', tags: ['Natural','Cabelo','Pele'], bairro: 'Sommerschield', cidade: 'Maputo', emoji: '💄', grad: ['#EC4899','#9D174D'], rating: 4.9, reviews: 470, prep: 10, min: 300, featured: true, promo: '', desc: 'Beleza natural moçambicana: mussiro, óleo de mafurra, coco e muito mais.', adult: false,
    sections: [
      { title: 'Rosto', items: [
        {id: 'p1301', name: 'Mussiro — máscara tradicional', price: 350, emoji: '🌿', kg: 0.1, tag: 'Ilha de Moçambique', desc: 'Pó de raiz de mussiro, usado há gerações pelas mulheres macuas para proteger e iluminar a pele.'},
        {id: 'p1302', name: 'Creme hidratante de rosto', price: 550, emoji: '🧴', kg: 0.1, desc: 'Com manteiga de karité e aloé.'},
        {id: 'p1303', name: 'Protetor solar FPS 50', price: 650, emoji: '☀️', kg: 0.2, desc: 'Resistente à água.'},
        {id: 'p1304', name: 'Batom mate', price: 320, emoji: '💄', kg: 0.05, desc: 'Longa duração. Várias cores.', opts: [{name: 'Cor', type: 'one', choices: [{l: 'Vermelho capulana', p: 0},{l: 'Nude cacau', p: 0},{l: 'Bordeaux', p: 0}]}]}
      ] },
      { title: 'Cabelo e corpo', items: [
        {id: 'p1305', name: 'Óleo de coco puro (250 ml)', price: 280, emoji: '🥥', kg: 0.3, desc: 'Prensado a frio, de Inhambane.'},
        {id: 'p1306', name: 'Óleo de mafurra (100 ml)', price: 390, emoji: '🌰', kg: 0.15, desc: 'Óleo tradicional para pele e cabelo.'},
        {id: 'p1307', name: 'Creme para cabelo crespo', price: 380, emoji: '💆🏾‍♀️', kg: 0.3, desc: 'Hidrata e define os caracóis.'},
        {id: 'p1308', name: 'Extensões para tranças (pack)', price: 450, emoji: '💇🏾‍♀️', kg: 0.2, desc: 'Fibra sintética, várias cores.'},
        {id: 'p1309', name: 'Turbante de capulana', price: 350, emoji: '🧣', kg: 0.1, desc: 'Feito à mão em Maputo.'},
        {id: 'p1310', name: 'Perfume floral (50 ml)', price: 1350, emoji: '🌸', kg: 0.2, desc: 'Notas de jasmim e frangipani.'},
        {id: 'p1311', name: 'Verniz de unhas', price: 150, emoji: '💅🏾', kg: 0.05, desc: 'Secagem rápida.'}
      ] }
    ]
  },
  /* ---------- Lar & Utilidades · Matola — Fomento (casa) ---------- */
  {
    id: 'lar-utilidades', name: 'Lar & Utilidades', cat: 'casa', kind: 'Utilidades domésticas', tags: ['Casa','Cozinha','Gás'], bairro: 'Matola — Fomento', cidade: 'Matola', emoji: '🏠', grad: ['#6366F1','#3730A3'], rating: 4.5, reviews: 312, prep: 15, min: 200, featured: false, promo: 'Recarga de gás ao domicílio', desc: 'Utilidades para a casa e cozinha, da capulana à botija de gás.', adult: false,
    sections: [
      { title: 'Cozinha', items: [
        {id: 'lu1', name: 'Recarga de gás (botija 9 kg)', desc: 'Troca da botija vazia por uma cheia. Só de carro.', price: 1100, emoji: '🔥', kg: 17, bulky: true, tag: 'Só de carro'},
        {id: 'lu2', name: 'Panela de alumínio (n.º 6)', desc: 'Ideal para xima e caril.', price: 680, emoji: '🍲', kg: 1.2},
        {id: 'lu3', name: 'Pilão de madeira', desc: 'Para pilar amendoim e folhas de matapa.', price: 950, emoji: '🪵', kg: 4, bulky: true},
        {id: 'lu4', name: 'Fogareiro a carvão', desc: 'Fogareiro tradicional em metal.', price: 450, emoji: '♨️', kg: 3},
        {id: 'lu5', name: 'Fósforos (pack 10)', desc: '', price: 40, emoji: '🔥', kg: 0.1}
      ] },
      { title: 'Casa', items: [
        {id: 'lu6', name: 'Capulana (2 m)', desc: 'Tecido estampado tradicional. Padrões variados.', price: 350, emoji: '🧣', kg: 0.3, tag: 'Popular', opts: [{name: 'Padrão', type: 'one', choices: [{l: 'Laranja e preto', p: 0},{l: 'Azul índico', p: 0},{l: 'Verde e amarelo', p: 0}]}]},
        {id: 'lu7', name: 'Esteira de palha', desc: 'Feita à mão em Inhambane.', price: 300, emoji: '🧺', kg: 1.5},
        {id: 'lu8', name: 'Lâmpadas LED (pack 3)', desc: '9 W, luz branca.', price: 260, emoji: '💡', kg: 0.3},
        {id: 'lu9', name: 'Velas (pack 6)', desc: 'Para os cortes de energia.', price: 90, emoji: '🕯️', kg: 0.4},
        {id: 'lu10', name: 'Pilhas AA (pack 4)', desc: '', price: 150, emoji: '🔋', kg: 0.1},
        {id: 'lu11', name: 'Bidão de água (20 L)', desc: 'Vazio, com torneira.', price: 380, emoji: '🪣', kg: 1.2, bulky: true}
      ] }
    ]
  }
];

const ADDRESSES = [
  {id: 'casa', label: 'Casa', icon: 'house', street: 'Av. Julius Nyerere, 1234, 3.º andar', bairro: 'Sommerschield', cidade: 'Maputo', ref: 'Prédio azul, ao lado da padaria'},
  {id: 'trabalho', label: 'Trabalho', icon: 'store', street: 'Av. Samora Machel, 245', bairro: 'Baixa', cidade: 'Maputo', ref: 'Em frente ao Jardim Tunduru'}
];

/* Métodos de pagamento (todos simulados). prefixes = indicativos válidos para o número */
const PAYMENTS = [
  {id: 'mpesa', name: 'M-Pesa', sub: 'Vodacom · 84 / 85', color: '#E60000', badge: 'M', mobile: true, prefixes: ['84','85']},
  {id: 'emola', name: 'e-Mola', sub: 'Movitel · 86 / 87', color: '#F28C00', badge: 'e', mobile: true, prefixes: ['86','87']},
  {id: 'mkesh', name: 'mKesh', sub: 'Tmcel · 82 / 83', color: '#0071BC', badge: 'mK', mobile: true, prefixes: ['82','83']},
  {id: 'cartao', name: 'Cartão', sub: 'Visa · Mastercard', color: '#1B1F3B', badge: '💳'},
  {id: 'dinheiro', name: 'Dinheiro na entrega', sub: 'Pague ao estafeta', color: '#2E7D32', badge: '💵'}
];

/* Estafetas (mota) e motoristas (carro) fictícios */
const RIDERS = {
  mota: [
    {name: 'Edson Macuácua', rating: 4.9, trips: 1820, vehicle: 'Mota 125cc · Vermelha', plate: 'AHG 214 MC', avatar: '🧑🏾'},
    {name: 'Fátima Sitoe', rating: 4.95, trips: 960, vehicle: 'Mota 150cc · Azul', plate: 'AJB 508 MC', avatar: '👩🏾'},
    {name: 'Hélder Mabunda', rating: 4.8, trips: 2410, vehicle: 'Mota 125cc · Preta', plate: 'AFK 731 MP', avatar: '👨🏾'},
    {name: 'Ana Cossa', rating: 4.8, trips: 1210, vehicle: 'Mota 125cc · Laranja Txova', plate: 'AGB 117 MC', avatar: '👩🏾'}
  ],
  carro: [
    {name: 'Joaquim Tembe', rating: 4.9, trips: 1340, vehicle: 'Toyota Vitz · Branco', plate: 'AGD 905 MC', avatar: '👨🏾‍🦱'},
    {name: 'Amélia Cumbe', rating: 4.85, trips: 780, vehicle: 'Toyota Probox · Prata', plate: 'AHM 342 MP', avatar: '👩🏾‍🦱'},
    {name: 'Celso Nhantumbo', rating: 4.9, trips: 1590, vehicle: 'Nissan NP200 · Branca (caixa aberta)', plate: 'AEX 118 MC', avatar: '🧔🏾'},
    {name: 'Dércio Langa', rating: 4.9, trips: 2050, vehicle: 'Toyota Corolla · Cinzento', plate: 'AFZ 640 MP', avatar: '👨🏾'}
  ]
};

/* Taxa = base + perKm × km (arredondado a 5 MT). Tempo = preparação + 4 + km × speed + extra. maxKg = limite da mota */
const VEHICLES = {
  mota: {id: 'mota', name: 'Mota', icon: 'scooter', emoji: '🛵', base: 45, perKm: 12, speed: 2.6, extra: 0, maxKg: 12, desc: 'Mais rápida no trânsito · até 12 kg'},
  carro: {id: 'carro', name: 'Carro', icon: 'car', emoji: '🚗', base: 110, perKm: 20, speed: 3.4, extra: 6, maxKg: 400, desc: 'Encomendas grandes e pesadas · bebidas em grade'}
};

const PROMOS = [
  {title: '10% no 1.º pedido', sub: 'Use o código TXOVA10', emoji: '🎉', grad: ['#E8341C','#FF8A3D']},
  {title: 'Compras pesadas?', sub: 'Escolha CARRO e receba tudo de uma vez', emoji: '🚗', grad: ['#C2410C','#F59E0B'], cat: 'casa'},
  {title: 'Farmácia 24 horas', sub: 'Envie a receita pela app', emoji: '💊', grad: ['#1F5FD1','#4C9BFF'], cat: 'farmacia'},
  {title: 'Matapa à sexta', sub: 'Sabores da Polana · desde 650 MT', emoji: '🥬', grad: ['#147A4A','#3BB273'], store: 'sabores-polana'},
  {title: 'Entrega grátis', sub: 'Código KANIMAMBO', emoji: '🛵', grad: ['#9C2C77','#E86FB0']}
];

/* type: pct (percentagem, max), fixed (valor, minSubtotal), freeDelivery */
const PROMO_CODES = {
  TXOVA10: {label: '10% de desconto (máx. 500 MT)', type: 'pct', value: 10, max: 500},
  KANIMAMBO: {label: 'Entrega grátis', type: 'freeDelivery'},
  ENTREGAGRATIS: {label: 'Entrega grátis', type: 'freeDelivery'},
  MAPUTO100: {label: '100 MT de desconto (pedidos acima de 1.000 MT)', type: 'fixed', value: 100, minSubtotal: 1000}
};

window.TX_DATA = { categories: CATEGORIES, stores: STORES, bairros: Object.keys(COORDS), coords: COORDS, addresses: ADDRESSES, payments: PAYMENTS, riders: RIDERS, promos: PROMOS, promoCodes: PROMO_CODES, vehicles: VEHICLES };
})();

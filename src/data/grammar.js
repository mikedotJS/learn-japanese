export const grammar = [
  // N5
  { pattern: 'です', meaning: 'être (poli)', level: 'N5', explanation: 'Copule polie. Utilisée pour affirmer quelque chose.', examples: ['学生です。(Je suis étudiant.)', 'これは本です。(C\'est un livre.)'] },
  { pattern: 'ます', meaning: 'forme polie des verbes', level: 'N5', explanation: 'Terminaison polie pour les verbes au présent/futur affirmatif.', examples: ['食べます。(Je mange.)', '行きます。(J\'y vais.)'] },
  { pattern: 'は〜です', meaning: '[sujet] est ~', level: 'N5', explanation: 'Structure de base pour décrire quelque chose. は marque le thème.', examples: ['私は学生です。(Je suis étudiant.)', '田中さんは先生です。(Tanaka est professeur.)'] },
  { pattern: 'の', meaning: 'particule possessive / de liaison', level: 'N5', explanation: 'Relie deux noms, indiquant la possession ou l\'appartenance.', examples: ['私の本 (mon livre)', '日本の文化 (la culture du Japon)'] },
  { pattern: 'を', meaning: 'particule d\'objet direct', level: 'N5', explanation: 'Marque le complément d\'objet direct du verbe.', examples: ['水を飲む (boire de l\'eau)', '本を読む (lire un livre)'] },
  { pattern: 'に', meaning: 'particule de direction/temps', level: 'N5', explanation: 'Indique la destination, le moment, ou le but.', examples: ['学校に行く (aller à l\'école)', '7時に起きる (se lever à 7h)'] },
  { pattern: 'で', meaning: 'particule de moyen/lieu', level: 'N5', explanation: 'Indique le lieu d\'action ou le moyen utilisé.', examples: ['電車で行く (y aller en train)', '教室で勉強する (étudier en classe)'] },
  { pattern: '〜たい', meaning: 'vouloir faire ~', level: 'N5', explanation: 'Exprime le désir de faire quelque chose. Se conjugue sur la base -masu.', examples: ['食べたい (je veux manger)', '日本に行きたい (je veux aller au Japon)'] },
  { pattern: '〜てください', meaning: 'veuillez faire ~', level: 'N5', explanation: 'Requête polie. Forme en -te + kudasai.', examples: ['見てください (veuillez regarder)', '教えてください (veuillez m\'enseigner)'] },
  { pattern: '〜ている', meaning: 'être en train de / état résultant', level: 'N5', explanation: 'Action en cours ou état résultant d\'une action passée.', examples: ['食べている (être en train de manger)', '知っている (savoir/connaître)'] },

  // N4
  { pattern: '〜たら', meaning: 'si / quand ~', level: 'N4', explanation: 'Conditionnel. Exprime une condition ou une action séquentielle.', examples: ['雨が降ったら、行かない。(S\'il pleut, je n\'irai pas.)', '家に帰ったら、電話します。(Quand je rentre, j\'appellerai.)'] },
  { pattern: '〜ば', meaning: 'si ~', level: 'N4', explanation: 'Conditionnel hypothétique. Exprime une condition générale.', examples: ['安ければ、買います。(Si c\'est pas cher, j\'achète.)', '勉強すれば、合格する。(Si tu étudies, tu réussiras.)'] },
  { pattern: '〜なければならない', meaning: 'devoir faire ~', level: 'N4', explanation: 'Exprime l\'obligation. Littéralement "si on ne fait pas, ça ne va pas".', examples: ['勉強しなければならない。(Je dois étudier.)', '行かなければならない。(Je dois y aller.)'] },
  { pattern: '〜てもいい', meaning: 'avoir la permission de ~', level: 'N4', explanation: 'Exprime la permission.', examples: ['入ってもいいですか。(Puis-je entrer ?)', '食べてもいいです。(Tu peux manger.)'] },
  { pattern: '〜そうだ (様態)', meaning: 'avoir l\'air de ~', level: 'N4', explanation: 'Exprime l\'apparence ou l\'impression basée sur l\'observation.', examples: ['美味しそうだ。(Ça a l\'air délicieux.)', '雨が降りそうだ。(On dirait qu\'il va pleuvoir.)'] },
  { pattern: '〜ようにする', meaning: 'faire en sorte de ~', level: 'N4', explanation: 'Exprime l\'effort pour atteindre un état ou une habitude.', examples: ['毎日運動するようにしている。(Je fais en sorte de faire du sport chaque jour.)'] },
  { pattern: '受身形 (〜られる)', meaning: 'forme passive', level: 'N4', explanation: 'Transforme le verbe en forme passive.', examples: ['先生に褒められた。(J\'ai été félicité par le prof.)', '雨に降られた。(Je me suis fait surprendre par la pluie.)'] },
  { pattern: '使役形 (〜させる)', meaning: 'forme causative', level: 'N4', explanation: 'Faire faire quelque chose à quelqu\'un.', examples: ['子供に野菜を食べさせる。(Faire manger des légumes à l\'enfant.)'] },

  // N3
  { pattern: '〜ことになる', meaning: 'il a été décidé que ~', level: 'N3', explanation: 'Exprime une décision prise (souvent par un groupe ou une autorité).', examples: ['来月、日本に行くことになった。(Il a été décidé que j\'irai au Japon le mois prochain.)'] },
  { pattern: '〜ことにする', meaning: 'décider de ~', level: 'N3', explanation: 'Exprime une décision personnelle.', examples: ['毎日走ることにした。(J\'ai décidé de courir tous les jours.)'] },
  { pattern: '〜ように', meaning: 'afin de ~ / pour que ~', level: 'N3', explanation: 'Exprime le but ou l\'objectif.', examples: ['忘れないように、メモする。(Je note pour ne pas oublier.)'] },
  { pattern: '〜わけではない', meaning: 'ce n\'est pas que ~', level: 'N3', explanation: 'Nuance une négation. Ce n\'est pas nécessairement le cas.', examples: ['嫌いなわけではない。(Ce n\'est pas que je n\'aime pas.)'] },
  { pattern: '〜に対して', meaning: 'envers / par rapport à ~', level: 'N3', explanation: 'Indique la cible d\'une action ou d\'un sentiment, ou un contraste.', examples: ['彼の意見に対して反対する。(S\'opposer à son opinion.)'] },
  { pattern: '〜として', meaning: 'en tant que ~', level: 'N3', explanation: 'Indique le rôle ou la capacité.', examples: ['教師として働く。(Travailler en tant que professeur.)'] },
  { pattern: '〜ついでに', meaning: 'en profiter pour ~ / tant qu\'à ~', level: 'N3', explanation: 'Profiter d\'une occasion pour faire quelque chose en plus.', examples: ['買い物のついでに、銀行に寄った。(En allant faire les courses, j\'en ai profité pour passer à la banque.)'] },
  { pattern: '〜一方で', meaning: 'd\'un côté ~ / tandis que ~', level: 'N3', explanation: 'Exprime un contraste entre deux situations.', examples: ['彼は優しい一方で、厳しいところもある。(Il est gentil, mais d\'un autre côté il peut être sévère.)'] },

  // N2
  { pattern: '〜に伴って', meaning: 'accompagnant ~ / avec ~', level: 'N2', explanation: 'Indique qu\'un changement s\'accompagne d\'un autre.', examples: ['経済成長に伴って、物価が上がった。(Avec la croissance économique, les prix ont augmenté.)'] },
  { pattern: '〜を踏まえて', meaning: 'en se basant sur ~ / tenant compte de ~', level: 'N2', explanation: 'Agir en prenant en considération quelque chose.', examples: ['結果を踏まえて、計画を変更する。(Modifier le plan en se basant sur les résultats.)'] },
  { pattern: '〜にもかかわらず', meaning: 'malgré ~ / en dépit de ~', level: 'N2', explanation: 'Exprime une concession. Le résultat est contraire à ce qu\'on attendrait.', examples: ['努力したにもかかわらず、失敗した。(Malgré mes efforts, j\'ai échoué.)'] },
  { pattern: '〜ざるを得ない', meaning: 'ne pas pouvoir s\'empêcher de ~ / être obligé de ~', level: 'N2', explanation: 'Obligation inévitable.', examples: ['認めざるを得ない。(Je suis obligé de l\'admettre.)'] },
  { pattern: '〜に限らず', meaning: 'pas limité à ~ / pas seulement ~', level: 'N2', explanation: 'Pas restreint à un cas particulier.', examples: ['学生に限らず、大人も参加できる。(Pas seulement les étudiants, les adultes aussi peuvent participer.)'] },
  { pattern: '〜からこそ', meaning: 'justement parce que ~', level: 'N2', explanation: 'Met l\'emphase sur la raison.', examples: ['好きだからこそ、厳しくする。(C\'est justement parce que je t\'aime que je suis sévère.)'] },

  // N1
  { pattern: '〜をもって', meaning: 'par le moyen de ~ / à compter de ~', level: 'N1', explanation: 'Indique le moyen, la limite temporelle ou la cause. Registre soutenu.', examples: ['本日をもって閉店いたします。(Nous fermons à compter d\'aujourd\'hui.)', '誠意をもって対応する。(Répondre avec sincérité.)'] },
  { pattern: '〜ともなると', meaning: 'quand il s\'agit de ~ / étant donné que ~', level: 'N1', explanation: 'Quand on atteint un certain niveau ou statut, quelque chose devient naturel.', examples: ['部長ともなると、責任が重い。(Quand on est directeur, les responsabilités sont lourdes.)'] },
  { pattern: '〜を余儀なくされる', meaning: 'être contraint de ~', level: 'N1', explanation: 'Être forcé par les circonstances à faire quelque chose. Très formel.', examples: ['計画の変更を余儀なくされた。(Nous avons été contraints de modifier le plan.)'] },
  { pattern: '〜たりとも〜ない', meaning: 'pas même un seul ~', level: 'N1', explanation: 'Négation emphatique. Pas même la plus petite quantité.', examples: ['一秒たりとも無駄にできない。(Je ne peux pas gaspiller ne serait-ce qu\'une seconde.)'] },
  { pattern: '〜いかんによらず', meaning: 'indépendamment de ~ / quel que soit ~', level: 'N1', explanation: 'Sans tenir compte d\'un facteur. Registre très formel.', examples: ['理由のいかんによらず、遅刻は認めない。(Quelle que soit la raison, le retard ne sera pas toléré.)'] },
  { pattern: '〜ならでは', meaning: 'propre à ~ / unique à ~', level: 'N1', explanation: 'Quelque chose qui n\'est possible qu\'avec un sujet particulier.', examples: ['京都ならではの美しさ。(Une beauté propre à Kyoto.)'] },
  { pattern: '〜んばかりに', meaning: 'comme si on allait ~ / au point de presque ~', level: 'N1', explanation: 'Exprime une intensité telle qu\'on dirait que l\'action va se produire.', examples: ['泣かんばかりに頼んだ。(Il a supplié au point qu\'on aurait dit qu\'il allait pleurer.)'] },
  { pattern: '〜極まりない', meaning: 'extrêmement ~ / au plus haut point', level: 'N1', explanation: 'Exprime un degré extrême. Souvent négatif.', examples: ['失礼極まりない態度。(Une attitude extrêmement impolie.)'] },
];

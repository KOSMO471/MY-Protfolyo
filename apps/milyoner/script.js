const questions = [
    // 1-10
    { question: "bu şarkı hangi şarkıcının bir şarkısından alıntıdır 'karakollar mı kuruldu bak yine akşam oldu neredesin ay yüzlüm'", answers: ["Murat Göğebakan", "Şebnem Ferah", "Manuş Baba", "Cem Adrian"], correct: 0 },
    { question: "'Domates, biber, patlıcan... Bir anda bütün dünyam karardı' sözleri kime aittir?", answers: ["Cem Karaca", "Barış Manço", "Erol Evgin", "Erkin Koray"], correct: 1 },
    { question: "'Sarı laleler aldım, çiçek pazarından...' şarkısını kim seslendirmektedir?", answers: ["MFÖ", "Mor ve Ötesi", "Gripin", "Model"], correct: 0 },
    { question: "'Resimdeki Gözyaşları' ve 'Tamirci Çırağı' şarkılarıyla devleşen isim kimdir?", answers: ["Fikret Kızılok", "Edip Akbayram", "Cem Karaca", "Selda Bağcan"], correct: 2 },
    { question: "'Çünkü sen çölüme yağmur oldun, sen gülüme toprak oldun' nakaratıyla bilinen sanatçımız kimdir?", answers: ["İbrahim Tatlıses", "Müslüm Gürses", "Ferdi Tayfur", "Orhan Gencebay"], correct: 1 },
    { question: "'Depremlerde yine yüreğim' hangi sanatçımızın eseridir?", answers: ["Levent Yüksel", "Tarkan", "Kenan Doğulu", "Mirkelam"], correct: 2 },
    { question: "'Dirilip de başınıza geçse de Sezar, gene olur Anadolu size bir mezar' sözü hangi şairin şiirinde geçmektedir?", answers: ["Nazım Hikmet", "Attila İlhan", "Sabahattin Ali", "Hüseyin Nihal Atsız"], correct: 3 },
    { question: "'Şinanay yavrum, şina şinanay...' aşağıdakilerden hangisiyle devam etmektedir?", answers: ["Beşiktaş", "Sezen Aksu", "Galatasaray", "Hopa Şinanay"], correct: 3 },
    { question: "Cumhuriyet dönemi şairlerinden 'Ben bir Ceviz Ağacıyım' gibi şiirleriyle tanınan ünlü şair kimdir?", answers: ["Nazım Hikmet", "Ahmet Hamdi Tanpınar", "Necip Fazıl", "Cahit Sıtkı Tarancı"], correct: 0 },
    { question: "Hangi enstrüman 'Türklerin milli çalgısı' olarak kabul edilir?", answers: ["Bağlama", "Keman", "Piyano", "Gitar"], correct: 0 },
    // 11-20
    { question: "'Mihriban' türküsünün söz yazarı ünlü şairimiz kimdir?", answers: ["Abdurrahim Karakoç", "Cahit Sıtkı Tarancı", "Özdemir Asaf", "Necip Fazıl Kısakürek"], correct: 0 },
    { question: "Yonca Evcimik'in 'Yaşanacaksa' şarkısını günümüzde hangi grup seslendiriyor?", answers: ["Manifest", "Duman", "maNga", "Kurtalan Ekspres"], correct: 0 },
    { question: "'Gesi Bağları' türküsünü rock formunda yorumlayarak geniş kitlelere sevdiren sanatçı?", answers: ["Selda Bağcan", "Barış Manço", "Cem Karaca", "Erkin Koray"], correct: 1 },
    { question: "İstiklal Marşı'mızın bestecisi kimdir?", answers: ["Osman Zeki Üngör", "Zeki Müren", "Münir Nurettin Selçuk", "Cemal Reşit Rey"], correct: 0 },
    { question: "'Arkadaşım Eşek' şarkısıyla çocukların kalbinde taht kuran sanatçı?", answers: ["Barış Manço", "İlhan İrem", "Kayahan", "Mazhar Alanson"], correct: 0 },
    { question: "Türkiye'nin Eurovision'daki ilk ve tek birinciliğini getiren isim?", answers: ["Sertab Erener", "Hadise", "Şebnem Paker", "Can Bonomo"], correct: 0 },
    { question: "Barış Manço'un tam adı nedir?", answers: ["Tosun Yusuf Mehmet Barış Manço", "Yılmaz Barış Manço", "Barış Kemal Manço", "Barış Manço"], correct: 0 },
    { question: "'hadi gel buluşalım, .....' boş olan yere ne gelecek?", answers: ["o ağacın altında", "eski köprünün altında", "eski binanın arkasında", "odada"], correct: 1 },
    { question: "'Yalan Dolan' ve 'Senden Daha Güzel' şarkılarıyla tanınan grup?", answers: ["Duman", "Manga", "Athena", "Pinhani"], correct: 0 },
    { question: "Aşık Veysel'in gözlerini kaybetmesine sebep olan hastalık nedir?", answers: ["Çiçek Hastalığı", "Kızamık", "Katarakt", "Glokom"], correct: 0 },
    // 21-30
    { question: "Neşet Ertaş hangi unvanla anılır?", answers: ["Bozkırın Tezenesi", "Halkın Sesi", "Garip", "Aşık"], correct: 0 },
    { question: "'Kuzu Kuzu' ve 'Şımarık' şarkılarıyla dünyaya açılan pop yıldızımız?", answers: ["Tarkan", "Mustafa Sandal", "Murat Boz", "Edis"], correct: 0 },
    { question: "'Tatlım Tatlım' şarkısıyla bilinen sanatçı?", answers: ["Bilal Hancı", "Mahsun Kırmızıgül", "Ersay Üner", "İzzet Yıldızhan"], correct: 2 },
    { question: "'Bir derdim var artık' nakaratıyla bilinen Mor ve Ötesi şarkısı?", answers: ["Bir Derdim Var", "Cambaz", "Oyunbozan", "Araf"], correct: 0 },
    { question: "Aşağıdakilerden hangisi bir telli çalgı değildir?", answers: ["Kaval", "Ud", "Kanun", "Cümbüş"], correct: 0 },
    { question: "Manifest grubunun 'Yaşanacaksa' klibindeki tarzları hangi eleştiriye maruz kalmıştır?", answers: ["Teşhircilik", "Siyasi Mesaj", "Gürültü", "Taklitçilik"], correct: 0 },
    { question: "'Aldırma Gönül' şiirinin yazarı kimdir?", answers: ["Sabahattin Ali", "Nazım Hikmet", "Ahmed Arif", "Can Yücel"], correct: 0 },
    { question: "'Sokaktayım, kimsesiz bir sokak ortasında; Yürüyorum...' dizeleri hangi şaire aittir?", answers: ["Necip Fazıl Kısakürek", "Yahya Kemal Beyatlı", "Ziya Gökalp", "Faruk Nafiz Çamlıbel"], correct: 0 },
    { question: "Türk pop müziğinin 'Sanat Güneşi' olarak anılan ismi kimdir?", answers: ["Zeki Müren", "Müzeyyen Senar", "Bülent Ersoy", "Emel Sayın"], correct: 0 },
    { question: "'Dilli Düdük' şarkısı kime aittir?", answers: ["Orhan Gencebay", "Ferdi Tayfur", "Tarkan", "İbrahim Tatlıses"], correct: 2 },
    // 31-40
    { question: "Sertab Erener Eurovision'da kaçıncı olmuştur?", answers: ["2.lik", "1.lik", "3.lük", "4.lük"], correct: 1 },
    { question: "Zakkum grubunun baş vokalisti kimdir?", answers: ["Eren Parlakgümüş", "Cem Yılmaztürk", "Yusuf Demirkol", "Cem Senyücel"], correct: 2 },
    { question: "'Paramparça' şarkısı kime aittir?", answers: ["Teoman", "Haluk Levent", "Kıraç", "Emre Aydın"], correct: 0 },
    { question: "Eurovision'da Türkiye'yi temsil eden ilk sanatçı kimdir?", answers: ["Semiha Yankı", "Ajda Pekkan", "Çetin Alp", "Mazhar Fuat Özkan"], correct: 0 },
    { question: "'Anason' hangi müzik grubunun eseridir?", answers: ["Zakkum", "Mor ve Ötesi", "Manifest", "maNga"], correct: 0 },
    { question: "'Çilli Bom' şarkısını popüler hale getiren isim/grup hangisidir?", answers: ["Hababam Sınıfı Korosu", "Mavi Işıklar", "Gripin", "Kargo"], correct: 1 },
    { question: "Hangisi 'Barış Manço'nun kurduğu gruptur?", answers: ["Kurtalan Ekspres", "Moğollar", "Mavi Işıklar", "Dadaşlar"], correct: 0 },
    { question: "Türk müziğinde 'Minik Serçe' olarak bilinen sanatçı kimdir?", answers: ["Yıldız Tilbe", "Sezen Aksu", "Aysel Gürel", "Nilüfer"], correct: 1 },
    { question: "'Sarı Gelin' türküsü hangi dillerde ortak söylenir?", answers: ["Türkçe-Ermenice", "Türkçe-Kürtçe", "Türkçe-Arapça", "Türkçe-Yunanca"], correct: 0 },
    { question: "'Sarmaşık' ve 'Karakol' şarkılarıyla bilinen sanatçı kimdir?", answers: ["Mabel Matiz", "Emir Can İğrek", "Uzi", "Edis"], correct: 0 },
    // 41-50
    { question: "Hangisi bir 'Karadeniz' çalgısıdır?", answers: ["Kemençe", "Ud", "Kanun", "Ney"], correct: 0 },
    { question: "Müzik eserlerini inceleyen, bilimsel yöntemlerle araştıran kişiye ne denir?", answers: ["Müzikolog", "Doktor", "Mühendis", "Avukat"], correct: 0 },
    { question: "Hangisi 'Duman' grubu üyesi değildir?", answers: ["Teoman", "Kaan Tangöze", "Batuhan Mutlugil", "Ari Barokas"], correct: 0 },
    { question: "Klasik Türk Müziği'nde ses dizilerine verilen isim nedir?", answers: ["Makam", "Usul", "Ebced", "Rumi"], correct: 0 },
    { question: "Selvi Boylum Al Yazmalım filminin unutulmaz müziği kime aittir?", answers: ["Cahit Berkay", "Melih Kibar", "Attila Özdemiroğlu", "Mazlum Çimen"], correct: 0 },
    { question: "'Kol düğmeleri' şarkısı kime aittir?", answers: ["Barış Manço", "Erol Evgin", "Cem Karaca", "İlhan İrem"], correct: 0 },
    { question: "Hangisi Şebnem Ferah'ın bir şarkısı değildir?", answers: ["Sigara", "Yağmur", "Mayın Tarlası", "Beni Al"], correct: 3 },
    { question: "'Ben sana mecburum bilemezsin...' dizeleri hangi şairimize aittir?", answers: ["Attila İlhan", "Cahit Külebi", "Behçet Necatigil", "Edip Cansever"], correct: 0 },
    { question: "'İstanbul'u dinliyorum gözlerim kapalı' şiiri kime aittir?", answers: ["Orhan Veli Kanık", "Ziya Osman Saba", "Ahmet Muhip Dıranas", "Enis Behiç Koryürek"], correct: 0 },
    { question: "Hangisi bir üflemeli çalgıdır?", answers: ["Ney", "Piyano", "Davul", "Çello"], correct: 0 }
];

const questionNumber = document.getElementById("questionNumber");
const scoreText = document.getElementById("scoreText");
const questionText = document.getElementById("questionText");
const answersContainer = document.getElementById("answersContainer");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");
const messageBox = document.getElementById("messageBox");
const moneyList = document.getElementById("moneyList").children;

const phoneJokerBtn = document.getElementById("phoneJoker");
const halfJokerBtn = document.getElementById("halfJoker");
const doubleJokerBtn = document.getElementById("doubleJoker");

let currentQuestionIndex = 0;
let score = 0;
let answered = false;
let randomizedQuestions = [];

let doubleChanceActive = false;
let doubleChanceUsed = false;
let halfJokerUsed = false;
let firstWrongDone = false;

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function initGame() {
    document.body.classList.remove("correct-flash", "wrong-flash");
    doubleChanceUsed = false;
    doubleChanceActive = false;
    halfJokerUsed = false;
    firstWrongDone = false;
    doubleJokerBtn.disabled = false;
    doubleJokerBtn.classList.remove("active");
    halfJokerBtn.disabled = false;
    phoneJokerBtn.disabled = false;

    // 1. ADIM: 50 soruluk havuzdan rastgele 20 tanesini seç
    let shuffledPool = shuffleArray([...questions]);
    randomizedQuestions = shuffledPool.slice(0, 20);

    randomizedQuestions.forEach(q => {
        const correctText = q.answers[q.correct];
        shuffleArray(q.answers);
        q.correct = q.answers.indexOf(correctText);
    });

    currentQuestionIndex = 0;
    score = 0;
    loadQuestion();
}

phoneJokerBtn.onclick = () => {
    phoneJokerBtn.disabled = true;
    messageBox.textContent = "Telefon jokeri kullanıldı.";
};

halfJokerBtn.onclick = () => {
    if (halfJokerUsed || answered) return;
    const currentQuestion = randomizedQuestions[currentQuestionIndex];
    const buttons = document.querySelectorAll(".answer-btn");
    let wrongIndices = [];
    currentQuestion.answers.forEach((_, idx) => { if (idx !== currentQuestion.correct) wrongIndices.push(idx); });
    shuffleArray(wrongIndices);
    const toHide = wrongIndices.slice(0, 2);
    buttons.forEach((btn, idx) => { if (toHide.includes(idx)) btn.style.visibility = "hidden"; });
    halfJokerUsed = true;
    halfJokerBtn.disabled = true;
    messageBox.textContent = "50:50 kullanıldı.";
};

doubleJokerBtn.onclick = () => {
    if (!doubleChanceUsed && !answered) {
        doubleChanceActive = true;
        doubleJokerBtn.classList.add("active");
        messageBox.textContent = "Çift cevap aktif!";
    }
};

function loadQuestion() {
    document.body.classList.remove("correct-flash");
    answered = false;
    nextBtn.disabled = true;
    firstWrongDone = false;

    const currentQuestion = randomizedQuestions[currentQuestionIndex];
    questionNumber.textContent = `Soru ${currentQuestionIndex + 1} / 20`; // 20 üzerinden gösterim
    scoreText.textContent = "Skor: " + score;
    questionText.textContent = currentQuestion.question;
    answersContainer.innerHTML = "";

    currentQuestion.answers.forEach((answer, index) => {
        const button = document.createElement("button");
        button.className = "answer-btn";
        button.textContent = answer;
        button.style.visibility = "visible";
        button.onclick = () => selectAnswer(index, button);
        answersContainer.appendChild(button);
    });

    updateMoneyBar();
}

function selectAnswer(selectedIndex, clickedButton) {
    if (answered) return;
    const currentQuestion = randomizedQuestions[currentQuestionIndex];
    const buttons = document.querySelectorAll(".answer-btn");

    if (selectedIndex === currentQuestion.correct) {
        answered = true;
        clickedButton.classList.add("correct");
        score++;
        document.body.classList.add("correct-flash");
        messageBox.textContent = "Doğru!";
        nextBtn.disabled = false;

        if (doubleChanceActive) {
            doubleChanceActive = false;
            doubleChanceUsed = true;
            doubleJokerBtn.disabled = true;
            doubleJokerBtn.classList.remove("active");
        }

        buttons.forEach((btn, idx) => {
            btn.disabled = true;
            if (idx === currentQuestion.correct) btn.classList.add("correct");
        });

        // 20. soruda bitiş kontrolü
        if (currentQuestionIndex === 19) {
            messageBox.textContent = "TEBRİKLER! 20 SORUYU DA BİLDİN VE BÜYÜK ÖDÜLÜ KAZANDIN!";
            nextBtn.disabled = true;
        }
    } else {
        if (doubleChanceActive && !firstWrongDone) {
            clickedButton.classList.add("wrong");
            clickedButton.disabled = true;
            messageBox.textContent = "Yanlış! İkinci hakkını kullan.";
            firstWrongDone = true;
        } else {
            answered = true;
            clickedButton.classList.add("wrong");
            document.body.classList.add("wrong-flash");
            messageBox.textContent = "Elendiniz! Sıfırlanıyor...";
            buttons.forEach((btn, idx) => {
                btn.disabled = true;
                if (idx === currentQuestion.correct) btn.classList.add("correct");
            });
            setTimeout(initGame, 2000);
        }
    }
}

function updateMoneyBar() {
    for (let i = 0; i < moneyList.length; i++) moneyList[i].classList.remove("active", "passed");
    
    // 2. ADIM: Ödül barı her 2 doğru cevapta bir ilerlesin
    let currentStep = Math.floor(score / 2); 
    
    for (let i = 0; i < currentStep; i++) {
        if (moneyList[i]) moneyList[i].classList.add("passed");
    }
    if (moneyList[currentStep]) moneyList[currentStep].classList.add("active");
}

nextBtn.onclick = () => {
    currentQuestionIndex++;
    loadQuestion();
};

restartBtn.onclick = initGame;
initGame();
/**
 * Awareness Academy - Language Switcher
 * This script injects a global language switcher button and translates static texts
 * across the site based on a comprehensive JSON dictionary.
 */

let currentLang = localStorage.getItem("preferredLanguage") || "en";

const jTranslations = [
    // --- Navigation & Core Links (Requested by User) ---
    { en: "Home", ta: "முகப்பு" },
    { en: "About", ta: "பற்றி" },
    { en: "Courses", ta: "பாடநெறிகள்" },
    { en: "Membership", ta: "உறுப்பினர்" },
    { en: "Gallery", ta: "புகைப்படங்கள்" },
    { en: "FAQ", ta: "கேள்விகள்" },
    { en: "Contact", ta: "தொடர்பு" },
    { en: "Login", ta: "உள்நுழைய" },
    { en: "Register", ta: "பதிவு செய்க" },

    // --- Footer & Legal ---
    { en: "About Us", ta: "எங்களைப் பற்றி" },
    { en: "Quick Links", ta: "விரைவு இணைப்புகள்" },
    { en: "Legal", ta: "சட்டபூர்வமானவை" },
    { en: "Contact Info", ta: "தொடர்புத் தகவல்" },
    { en: "Terms & Conditions", ta: "விதிமுறைகள் மற்றும் நிபந்தனைகள்" },
    { en: "Privacy Policy", ta: "தனியுரிமைக் கொள்கை" },
    { en: "Login / Register", ta: "உள்நுழை / பதிவு செய்" },
    { en: "AWARENESS ACADEMY", ta: "அவேர்னஸ் அகாடமி" },
    { en: "A sanctuary for transformation, empowering individuals to live with clarity, purpose, and harmony through ancient wisdom and modern practices.", ta: "பழங்கால ஞானம் மற்றும் நவீன நடைமுறைகள் மூலம் தெளிவு, நோக்கம் மற்றும் நல்லிணக்கத்துடன் வாழ தனிநபர்களை மேம்படுத்தும் ஒரு மாற்றக் கூடம்." },

    // --- Index Page Specific ---
    { en: "Discover inner peace and transformation through our guided spiritual courses.", ta: "எங்களது வழிகாட்டப்பட்ட ஆன்மீகப் படிப்புகள் மூலம் மன அமைதியையும் மாற்றத்தையும் கண்டறியுங்கள்." },
    { en: "Begin Your Journey", ta: "உங்கள் பயணத்தைத் தொடங்குங்கள்" },
    { en: "Discover More", ta: "மேலும் அறிய" },
    { en: "Students Enrolled", ta: "பதிவு செய்த மாணவர்கள்" },
    { en: "Courses Available", ta: "கிடைக்கும் படிப்புகள்" },
    { en: "Learning Hours", ta: "கற்றல் நேரங்கள்" },
    { en: "Years Experience", ta: "ஆண்டுகள் அனுபவம்" },
    { en: "✦ Why Us", ta: "✦ ஏன் நாங்கள்" },
    { en: "Why Choose AWARENESS ACADEMY", ta: "ஏன் அவேர்னஸ் அகாடமியை தேர்வு செய்ய வேண்டும்" },
    { en: "Discover the unique benefits that set us apart in your spiritual journey", ta: "உங்கள் ஆன்மீகப் பயணத்தில் எங்களைத் தனித்துவமாக்கும் தனிச்சிறப்புகளை கண்டறியுங்கள்" },
    { en: "Expert Guidance", ta: "நிபுணர் வழிகாட்டுதல்" },
    { en: "Learn from experienced mentors with over 12 years of expertise in acupuncture, reiki, yoga, and spiritual training.", ta: "அக்குபஞ்சர், ரெய்கி, யோகா மற்றும் ஆன்மீகப் பயிற்சியில் 12 ஆண்டுகளுக்கும் மேலான நிபுணத்துவம் பெற்ற அனுபவமிக்க வழிகாட்டிகளிடமிருந்து கற்றுக்கொள்ளுங்கள்." },
    { en: "Flexible Learning", ta: "நெகிழ்வான கற்றல்" },
    { en: "Access courses anytime, anywhere. Learn at your own pace with lifetime access to all course materials.", ta: "எப்போது வேண்டுமானாலும், எங்கு வேண்டுமானாலும் படிப்புகளை அணுகலாம். அனைத்து பாடப்பொருள்களுக்கும் வாழ்நாள் முழுவதும் அணுகலுடன் உங்கள் சொந்த வேகத்தில் கற்றுக்கொள்ளுங்கள்." },
    { en: "Certification", ta: "சான்றிதழ்" },
    { en: "Earn recognized certificates upon course completion to showcase your spiritual development journey.", ta: "உங்கள் ஆன்மீக வளர்ச்சிப் பயணத்தைக் காட்ட படிப்பு முடிந்ததும் அங்கீகரிக்கப்பட்ட சான்றிதழ்களைப் பெறுங்கள்." },
    { en: "Community Support", ta: "சமூக ஆதரவு" },
    { en: "Join a vibrant community of like-minded seekers for mutual support and shared wisdom.", ta: "பரஸ்பர ஆதரவு மற்றும் பகிரப்பட்ட ஞானத்திற்காக ஒத்த எண்ணம் கொண்ட தேடுபவர்களின் துடிப்பான சமூகத்தில் சேரவும்." },
    { en: "Ancient Wisdom", ta: "பண்டைய ஞானம்" },
    { en: "Explore time-tested practices rooted in Vedic traditions, adapted for contemporary life.", ta: "வேத மரபுகளில் வேரூன்றிய, சமகால வாழ்க்கைக்கு ஏற்றவாறு மாற்றியமைக்கப்பட்ட, காலம் சோதித்த நடைமுறைகளை ஆராயுங்கள்." },
    { en: "Personal Transformation", ta: "தனிப்பட்ட மாற்றம்" },
    { en: "Experience profound personal growth and achieve self-sufficiency through holistic practices.", ta: "முழுமையான நடைமுறைகள் மூலம் ஆழமான தனிப்பட்ட வளர்ச்சியை அனுபவிக்கவும் மற்றும் தன்னிறைவை அடையவும்." },
    { en: "✦ Featured", ta: "✦ முக்கியமானவை" },
    { en: "Featured Courses", ta: "முக்கிய படிப்புகள்" },
    { en: "Start your spiritual journey with our latest courses", ta: "எங்கள் புதிய படிப்புகளுடன் உங்கள் ஆன்மீகப் பயணத்தைத் தொடங்குங்கள்" },
    { en: "Loading", ta: "ஏற்றப்படுகிறது" },
    { en: "Loading course...", ta: "படிப்பை ஏற்றுகிறது..." },
    { en: "Please wait while we fetch the latest courses.", ta: "சமீபத்திய படிப்புகளைப் பெறும்வரை காத்திருக்கவும்." },
    { en: "View All Courses", ta: "அனைத்து படிப்புகளை காண்க" },
    { en: "Learn More", ta: "மேலும் அறிக" },
    { en: "Browse Courses", ta: "படிப்புகளை உலாவுக" },
    { en: "Free", ta: "இலவசம்" },
    { en: "✦ Testimonials", ta: "✦ சான்றுகள்" },
    { en: "What Our Students Say", ta: "எங்கள் மாணவர்கள் என்ன சொல்கிறார்கள்" },
    { en: "Real transformations from real people", ta: "உண்மையான மக்களிடமிருந்து உண்மையான மாற்றங்கள்" },
    { en: "AWARENESS ACADEMY has completely transformed my approach to life. The meditation course helped me find inner peace I never thought possible.", ta: "அவேர்னஸ் அகாடமி எனது வாழ்க்கை முறையை முற்றிலுமாக மாற்றிவிட்டது. தியானப் படிப்பு நான் நினைத்திராத மன நிம்மதியைக் கண்டறிய உதவியது." },
    { en: "The ancient wisdom courses bridged the gap between traditional teachings and modern application. Truly a life-changing experience that I'd recommend to everyone!", ta: "பழங்கால ஞானப் படிப்புகள் பாரம்பரிய போதனைகளுக்கும் நவீன நடைமுறைகளுக்கும் இடைவெளியைக் குறைக்கின்றன. அனைவருக்கும் பரிந்துரைக்கும் உண்மையிலேயே வாழ்க்கையை மாற்றும் அனுபவம்!" },
    { en: "The supportive community and expert guidance made my spiritual journey truly rewarding. I'm grateful for this transformative experience at Awareness Academy.", ta: "இந்த ஆதரவான சமூகமும் நிபுணர் வழிகாட்டுதலும் எனது ஆன்மீக பயணத்தை மிகவும் பயனுள்ளதாக மாற்றியது. அவேர்னஸ் அகாடமியில் பெற்ற இந்த மாற்றத்திற்கான அனுபவத்திற்கு நான் நன்றியுள்ளவனாக இருக்கிறேன்." },

    // --- Other Page Majors (Headers) ---
    { en: "Membership Packages", ta: "உறுப்பினர் தொகுப்புகள்" },
    { en: "Our Gallery", ta: "எங்கள் புகைப்பட தொகுப்பு" },
    { en: "Frequently Asked Questions", ta: "அடிக்கடி கேட்கப்படும் கேள்விகள்" },
    { en: "Contact Us", ta: "எங்களை தொடர்பு கொள்ள" },
    { en: "Discover Your True Potential With Us", ta: "எங்களுடன் உங்கள் உண்மையான திறனைக் கண்டறியுங்கள்" },
    { en: "Transforming Lives Through Harmony, Purpose & Self-Reliance", ta: "நல்லிணக்கம், நோக்கம் மற்றும் தன்னம்பிக்கை மூலம் வாழ்க்கையை மாற்றுதல்" },
    { en: "Explore Courses", ta: "படிப்புகளை ஆராயுங்கள்" },
    { en: "Years of Excellence", ta: "சிறப்பான ஆண்டுகள்" },
    { en: "Lives Transformed", ta: "மாற்றப்பட்ட வாழ்க்கைகள்" },
    { en: "Training Levels", ta: "பயிற்சி நிலைகள்" },
    { en: "Inner Peace", ta: "உள் அமைதி" },
    { en: "Mental Clarity", ta: "மனத் தெளிவு" },
    { en: "Life Success", ta: "வாழ்க்கை வெற்றி" },
    { en: "Scroll Down", ta: "கீழே உருட்டவும்" },
    { en: "Our Philosophy", ta: "எங்கள் தத்துவம்" },
    { en: "The Five-Fold Harmony", ta: "ஐந்து-மடிப்பு நல்லிணக்கம்" },
    { en: "Physical Health", ta: "உடல் ஆரோக்கியம்" },
    { en: "Mental Well-Being", ta: "மனநலம்" },
    { en: "Wealth & Prosperity", ta: "செல்வம் மற்றும் செழிப்பு" },
    { en: "Harmonious Relationships", ta: "இணக்கமான உறவுகள்" },
    { en: "Life Mastery", ta: "வாழ்க்கை தேர்ச்சி" },
    { en: "Our Mission", ta: "எங்கள் நோக்கம்" },
    { en: "Building Self-Reliant Individuals", ta: "தன்னம்பிக்கையுள்ள நபர்களை உருவாக்குதல்" },
    { en: "Healthy", ta: "ஆரோக்கியமான" },
    { en: "Happy", ta: "மகிழ்ச்சியான" },
    { en: "Financially Independent", ta: "நிதி சுதந்திரம்" },
    { en: "Emotionally Strong", ta: "உணர்ச்சிவசப்பட்ட வலிமை" },
    { en: "Self-Reliant", ta: "தன்னம்பிக்கை" },
    { en: "Purpose-Driven", ta: "நோக்கம் உந்தப்பட்ட" },
    { en: "Community Impact", ta: "சமூக தாக்கம்" },
    { en: "What We Do", ta: "நாங்கள் என்ன செய்கிறோம்" },
    { en: "Core Areas of Transformation", ta: "மாற்றத்தின் முக்கிய பகுதிகள்" },
    { en: "Personal Evolution", ta: "தனிப்பட்ட பரிணாமம்" },
    { en: "Inner Peace & Spiritual Growth", ta: "உள் அமைதி மற்றும் ஆன்மீக வளர்ச்சி" },
    { en: "Financial & Life Stability", ta: "நிதி மற்றும் வாழ்க்கை நிலைத்தன்மை" },
    { en: "Building Self-Sufficient Society", ta: "சுயசார்பு சமுதாயத்தை உருவாக்குதல்" },
    { en: "Our Vision", ta: "எங்கள் பார்வை" },
    { en: "Creating a Conscious Future", ta: "ஒரு விழிப்புணர்வுள்ள எதிர்காலத்தை உருவாக்குதல்" },
    { en: "Years Guiding Lives", ta: "வாழ்க்கையை வழிநடத்தும் ஆண்டுகள்" },
    { en: "Our Founder", ta: "எங்கள் நிறுவனர்" },
    { en: "Areas of Mastery", ta: "தேர்ச்சி பெற்ற பகுதிகள்" },
    { en: "Acupuncture", ta: "அக்குபஞ்சர்" },
    { en: "Mudras", ta: "முத்திரைகள்" },
    { en: "Reiki", ta: "ரெய்கி" },
    { en: "Yoga", ta: "யோகா" },
    { en: "Meditation", ta: "தியானம்" },
    { en: "Energy Practices", ta: "ஆற்றல் பயிற்சிகள்" },
    { en: "Inner Liberation & Emotional Stability", ta: "உள் விடுதலை மற்றும் உணர்ச்சி நிலைத்தன்மை" },
    { en: "Spiritual Awareness & Growth", ta: "ஆன்மீக விழிப்புணர்வு மற்றும் வளர்ச்சி" },
    { en: "Financial Growth & Prosperity", ta: "நிதி வளர்ச்சி மற்றும் செழிப்பு" },
    { en: "Sustainable Success in Life", ta: "வாழ்க்கையில் நிலையான வெற்றி" },
    { en: "Why Awareness Academy?", ta: "ஏன் அவேர்னஸ் அகாடமி?" },
    { en: "Multi-Level Programs", ta: "பல நிலை திட்டங்கள்" },
    { en: "Wisdom + Practicality", ta: "ஞானம் + நடைமுறை" },
    { en: "Inner & Outer Growth", ta: "உள் மற்றும் வெளிப்புற வளர்ச்சி" },
    { en: "Latest Insights", ta: "சமீபத்திய நுண்ணறிவு" },
    { en: "Our Blog", ta: "எங்கள் வலைப்பதிவு" },
    { en: "Begin Your Transformation Journey", ta: "உங்கள் உருமாற்ற பயணத்தை தொடங்குங்கள்" },
    { en: "Get in Touch", ta: "தொடர்பில் இருங்கள்" },
    { en: "Discover Sacred Paths", ta: "புனிதப் பாதைகளைக் கண்டறியவும்" },
    { en: "Explore courses curated by enlightened mentors. Your course to self-discovery starts here.", ta: "ஞானோதயம் பெற்ற வழிகாட்டிகளால் நிர்வகிக்கப்படும் படிப்புகளை ஆராயுங்கள். சுய கண்டுபிடிப்புக்கான உங்கள் படிப்பு இங்கே தொடங்குகிறது." },
    { en: "All Paths", ta: "அனைத்து பாதைகள்" },
    { en: "Philosophy", ta: "தத்துவம்" },
    { en: "Motivation", ta: "உந்துதல்" },
    { en: "Sort by: Newest", ta: "வரிசைப்படுத்து: புதியவை" },
    { en: "Price: Low to High", ta: "விலை: குறைவு முதல் அதிகம்" },
    { en: "Price: High to Low", ta: "விலை: அதிகம் முதல் குறைவு" },
    { en: "Name: A-Z", ta: "பெயர்: அ-ழ" },
    { en: "Name: Z-A", ta: "பெயர்: ழ-அ" },
    { en: "Enroll Now", ta: "இப்போது பதிவு செய்க" },
    { en: "Money-back guarantee", ta: "பணம் திரும்ப உத்தரவாதம்" },
    { en: "Course Title", ta: "பாடநெறி தலைப்பு" },
    { en: "By", ta: "மூலம்" },
    { en: "Mentor Name", ta: "வழிகாட்டி பெயர்" },
    { en: "About this Path", ta: "இந்த பாதையைப் பற்றி" },
    { en: "Curriculum Preview", ta: "பாடத்திட்ட முன்னோட்டம்" },
    { en: "Choose the perfect package for your spiritual journey", ta: "உங்கள் ஆன்மீக பயணத்திற்கான சிறந்த தொகுப்பைத் தேர்ந்தெடுக்கவும்" },
    { en: "Loading membership packages...", ta: "உறுப்பினர் தொகுப்புகளை ஏற்றுகிறது..." },
    { en: "No Membership Packages Available", ta: "உறுப்பினர் தொகுப்புகள் எதுவும் இல்லை" },
    { en: "Please check back later for new membership options.", ta: "புதிய உறுப்பினர் தொகுப்புகளுக்கு பின்னர் மீண்டும் சரிபார்க்கவும்." },
    { en: "Not Available", ta: "கிடைக்கவில்லை" },
    { en: "Offer has expired", ta: "சலுகை முடிந்தது" },
    { en: "Program Duration", ta: "நிகழ்ச்சி காலம்" },
    { en: "Not Available Now", ta: "தற்போது கிடைக்கவில்லை" },
    { en: "Already Enrolled", ta: "ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது" },
    { en: "Explore our collection of inspiring moments and memories", ta: "எங்களின் உத்வேகம் தரும் தருணங்கள் மற்றும் நினைவுகளின் தொகுப்பை ஆராயுங்கள்" },
    { en: "Loading gallery...", ta: "புகைப்பட கேலரியை ஏற்றுகிறது..." },
    { en: "No Images Yet", ta: "இன்னும் படங்கள் இல்லை" },
    { en: "Check back soon for new updates!", ta: "புதிய புதுப்பிப்புகளுக்கு விரைவில் பார்க்கவும்!" },
    { en: "Failed to load gallery. Please try again later.", ta: "கேலரியை ஏற்ற முடியவில்லை. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்." },
    { en: "Find answers to common questions about our spiritual courses, enrollment process, and programs at Awareness Academy.", ta: "எங்கள் ஆன்மீக படிப்புகள், சேர்க்கை செயல்முறை மற்றும் திட்டங்கள் பற்றிய பொதுவான கேள்விகளுக்கான பதில்களை அவேர்னஸ் அகாடமியில் கண்டறியவும்." },
    { en: "Loading frequently asked questions...", ta: "அடிக்கடி கேட்கப்படும் கேள்விகளை ஏற்றுகிறது..." },
    { en: "No FAQs Available", ta: "அடிக்கடி கேட்கப்படும் கேள்விகள் எதுவும் இல்லை" },
    { en: "Still Have Questions?", ta: "இன்னும் கேள்விகள் உள்ளதா?" },
    { en: "Our team is here to help you on your spiritual journey. Get personalized guidance and answers.", ta: "உங்கள் ஆன்மீக பயணத்தில் உதவ எங்கள் குழு உள்ளது. தனிப்பயனாக்கப்பட்ட வழிகாட்டுதல் மற்றும் பதில்களைப் பெறுங்கள்." },
    { en: "Let's Connect on Your Spiritual Journey", ta: "உங்கள் ஆன்மீக பயணத்தில் இணைவோம்" },
    { en: "Our sanctuary is always open for seekers. Reach out for course inquiries, guidance, or to schedule a visit to our academy.", ta: "தேடுபவர்களுக்காக எங்கள் சரணாலயம் எப்போதும் திறந்திருக்கும். பாட விசாரணைகள், வழிகாட்டுதல்கள் அல்லது எங்கள் அகாடமிக்கு வருகையைத் திட்டமிடுவதற்குத் தொடர்புகொள்ளவும்." },
    { en: "Speak with Us", ta: "எங்களுடன் பேசுங்கள்" },
    { en: "Available 9:00 AM - 8:00 PM", ta: "காலை 9:00 முதல் இரவு 8:00 வரை கிடைக்கும்" },
    { en: "Message Us", ta: "எங்களுக்கு தகவல் அனுப்புங்கள்" },
    { en: "We usually reply within 24 hours", ta: "நாங்கள் பொதுவாக 24 மணி நேரத்திற்குள் பதிலளிப்போம்" },
    { en: "Our Sanctuary", ta: "எங்கள் சரணாலயம்" },
    { en: "Thammampatty, Salem District", ta: "தம்மம்பட்டி, சேலம் மாவட்டம்" },
    { en: "Tamil Nadu, India - 636113", ta: "தமிழ்நாடு, இந்தியா - 636113" },
    { en: "Meditation Hours", ta: "தியான நேரங்கள்" },
    { en: "Mon - Sun: 5:00 AM - 9:00 PM", ta: "திங்கள் - ஞாயிறு: காலை 5:00 - இரவு 9:00" },
    { en: "Open for personal practice", ta: "தனிப்பட்ட பயிற்சிக்காக திறக்கப்பட்டுள்ளது" },
    { en: "Direct Inquiry", ta: "நேரடி விசாரணை" },
    { en: "Fill out the form below and one of our mentors will get back to you shortly.", ta: "கீழேயுள்ள படிவத்தை நிரப்பவும், எங்கள் வழிகாட்டிகளில் ஒருவர் விரைவில் உங்களைத் தொடர்புகொள்வார்." },
    { en: "Seeker Name", ta: "தேடுபவர் பெயர்" },
    { en: "Email Address", ta: "மின்னஞ்சல் முகவரி" },
    { en: "Contact Number", ta: "தொடர்பு எண்" },
    { en: "Inquiry Topic", ta: "விசாரணை தலைப்பு" },
    { en: "Select a path...", ta: "ஒரு பாதையைத் தேர்ந்தெடுக்கவும்..." },
    { en: "Course Information", ta: "பாடத் தகவல்" },
    { en: "Meditation Guidance", ta: "தியான வழிகாட்டுதல்" },
    { en: "Enrollment Process", ta: "பதிவு முறை" },
    { en: "Technical Support", ta: "தொழில்நுட்ப உதவி" },
    { en: "Feedback", ta: "கருத்து" },
    { en: "Other", ta: "மற்றவை" },
    { en: "Your Message", ta: "உங்கள் செய்தி" },
    { en: "Send Message", ta: "செய்தியை அனுப்பு" },
    { en: "Please read these terms carefully before using our platform", ta: "எங்கள் தளத்தைப் பயன்படுத்துவதற்கு முன் இந்த விதிமுறைகளை கவனமாகப் படிக்கவும்" },
    { en: "Introduction", ta: "அறிமுகம்" },
    { en: "Account Registration", ta: "கணக்கு பதிவு" },
    { en: "Course Access & Enrollment", ta: "பாட அணுகல் & பதிவு" },
    { en: "Free Courses", ta: "இலவச பாடநெறிகள்" },
    { en: "Paid Courses", ta: "கட்டணப் பாடநெறிகள்" },
    { en: "Payment & Refunds", ta: "கட்டணம் மற்றும் திரும்பப் பெறுதல்" },
    { en: "Payment Processing", ta: "கட்டண செயலாக்கம்" },
    { en: "Refund Policy", ta: "திரும்பப் பெறுதல் கொள்கை" },
    { en: "Intellectual Property", ta: "அறிவுசார் சொத்து" },
    { en: "User Conduct", ta: "பயனர் நடத்தை" },
    { en: "Certificates", ta: "சான்றிதழ்கள்" },
    { en: "Disclaimers & Limitations", ta: "பொறுப்புத் துறப்பு மற்றும் வரம்புகள்" },
    { en: "Account Termination", ta: "கணக்கு நிறுத்தம்" },
    { en: "Changes to Terms", ta: "விதிமுறைகளில் மாற்றங்கள்" },
    { en: "Governing Law", ta: "நிர்வாக சட்டம்" },
    { en: "Your privacy is important to us. Learn how we collect, use, and protect your data.", ta: "உங்கள் தனியுரிமை எங்களுக்கு முக்கியமானது. நாங்கள் உங்கள் தரவை எவ்வாறு சேகரிக்கிறோம், பயன்படுத்துகிறோம் மற்றும் பாதுகாக்கிறோம் என்பதை அறியவும்." },
    { en: "Our Commitment to Privacy", ta: "தனியுரிமைக்கான எங்கள் உறுதிப்பாடு" },
    { en: "Information We Collect", ta: "நாங்கள் சேகரிக்கும் தகவல்கள்" },
    { en: "How We Use Your Information", ta: "உங்கள் தகவலை நாங்கள் எவ்வாறு பயன்படுத்துகிறோம்" },
    { en: "Cookies & Tracking Technologies", ta: "குக்கீகள் & கண்காணிப்பு தொழில்நுட்பங்கள்" },
    { en: "Information Sharing & Disclosure", ta: "தகவல் பரிமாற்றம் மற்றும் வெளிப்படுத்தல்" },
    { en: "Data Security", ta: "தரவு பாதுகாப்பு" },
    { en: "Your Privacy Rights", ta: "உங்கள் தனியுரிமை உரிமைகள்" },
    { en: "Children's Privacy", ta: "குழந்தைகளின் தனியுரிமை" },
    { en: "International Data Transfers", ta: "சர்வதேச தரவு இடமாற்றங்கள்" },
    { en: "Data Retention", ta: "தரவு வைத்திருத்தல்" },
    { en: "Changes to This Privacy Policy", ta: "இந்த தனியுரிமைக் கொள்கையில் மாற்றங்கள்" },
    { en: "Welcome Back", ta: "மீண்டும் வருக" },
    { en: "Login to continue your journey", ta: "உங்கள் பயணத்தைத் தொடர உள்நுழையவும்" },
    { en: "Email or Unique ID", ta: "மின்னஞ்சல் அல்லது தனிப்பட்ட ஐடி" },
    { en: "Password", ta: "கடவுச்சொல்" },
    { en: "Forgot Password?", ta: "கடவுச்சொல்லை மறந்துவிட்டீர்களா?" },
    { en: "Login to Dashboard", ta: "முகப்புப்பக்கத்தில் உள்நுழையவும்" },
    { en: "New seeker?", ta: "புதிய தேடுபவரா?" },
    { en: "Sign Up", ta: "பதிவு செய்க" },
    { en: "Join our sanctuary of wisdom.", ta: "எங்கள் ஞான சரணாலயத்தில் சேருங்கள்." },
    { en: "Details", ta: "விவரங்கள்" },
    { en: "Verify Email", ta: "மின்னஞ்சலைச் சரிபார்க்கவும்" },
    { en: "Full Name", ta: "முழு பெயர்" },
    { en: "Enter 10-digit mobile number (numbers only)", ta: "10 இலக்க மொபைல் எண்ணை உள்ளிடவும் (எண்கள் மட்டும்)" },
    { en: "Profile Picture (Optional)", ta: "சுயவிவரப் படம் (விருப்பத்திற்குரியது)" },
    { en: "Send OTP", ta: "OTP அனுப்பு" },
    { en: "Enter OTP", ta: "OTP ஐ உள்ளிடவும்" },
    { en: "Verify OTP", ta: "OTP ஐ சரிபார்க்கவும்" },
    { en: "Back", ta: "பின்செல்" },
    { en: "Create Password", ta: "கடவுச்சொல்லை உருவாக்கவும்" },
    { en: "8+ Characters", ta: "8+ எழுத்துக்கள்" },
    { en: "1 Uppercase", ta: "1 பெரிய எழுத்து" },
    { en: "1 Lowercase", ta: "1 சிறிய எழுத்து" },
    { en: "1 Number", ta: "1 எண்" },
    { en: "1 Symbol", ta: "1 குறியீடு" },
    { en: "Confirm Password", ta: "கடவுச்சொல்லை உறுதிப்படுத்தவும்" },
    { en: "I agree to the", ta: "நான் ஏற்றுக்கொள்கிறேன்" },
    { en: "and", ta: "மற்றும்" },
    { en: "Complete Registration", ta: "பதிவை முடிக்கவும்" },
    { en: "Already have an account?", ta: "ஏற்கனவே ஒரு கணக்கு உள்ளதா?" },
    { en: "Registration Successful!", ta: "பதிவு வெற்றிகரமானது!" },
    { en: "Welcome to AWARENESS ACADEMY! Your account has been created successfully.", ta: "அவேர்னஸ் அகாடமியில் வரவேற்கிறோம்! உங்கள் கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டுள்ளது." },
    { en: "Your Student ID", ta: "உங்கள் மாணவர் ஐடி" },
    { en: "Go to Login Now", ta: "இப்போது உள்நுழையவும்" },
    { en: "Read More", ta: "மேலும் படிக்க" },
    { en: "No blogs available yet", ta: "வலைப்பதிவுகள் எதுவும் இன்னும் கிடைக்கவில்லை" },
    { en: "We're working on creating amazing content for you. Check back soon!", ta: "நாங்கள் உங்களுக்காக அற்புதமான உள்ளடக்கங்களை உருவாக்குகிறோம். விரைவில் பார்க்கவும்!" },
    { en: "Unable to load blogs", ta: "வலைப்பதிவுகளை ஏற்ற முடியவில்லை" },
    { en: "Please try again later.", ta: "தயவுசெய்து பின் முயற்சிக்கவும்." }
];

function injectLanguageSwitcher() {
    if (document.getElementById('langSwitcherBtnContainer')) return; // Already injected

    const style = document.createElement('style');
    style.innerHTML = `
        .lang-switcher-container {
            position: fixed;
            top: 85px;
            right: 50px;
            z-index: 990;
        }
        #langSwitcherBtn {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(8px);
            border: 2px solid var(--color-saffron, #ff9933);
            color: var(--color-text-primary, #333);
            padding: 8px 18px;
            border-radius: 30px;
            font-weight: 600;
            font-family: inherit;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9rem;
        }
        #langSwitcherBtn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.12);
            background: var(--color-saffron, #ff9933);
            color: white;
        }
        #langSwitcherBtn:hover i {
            color: white !important;
        }
        @media (max-width: 768px) {
            .lang-switcher-container {
                top: 75px;
                right: 15px;
            }
            #langSwitcherBtn {
                padding: 6px 14px;
                font-size: 0.8rem;
            }
        }
    `;
    document.head.appendChild(style);

    const container = document.createElement('div');
    container.id = 'langSwitcherBtnContainer';
    container.className = 'lang-switcher-container';
    container.innerHTML = `
        <button id="langSwitcherBtn" onclick="switchLanguage()">
            <i class="fas fa-language" style="color: var(--color-saffron, #ff9933); font-size: 1.1rem; transition: color 0.3s ease;"></i> 
            <span id="langLabel">தமிழ் / TAMIL</span>
        </button>
    `;
    document.body.appendChild(container);
}

window.switchLanguage = function () {
    currentLang = currentLang === 'en' ? 'ta' : 'en';
    localStorage.setItem("preferredLanguage", currentLang);
    updateLanguageUI();
    replaceText(currentLang);
};

function updateLanguageUI() {
    const label = document.getElementById("langLabel");
    if (label) {
        label.innerText = currentLang === "en" ? "தமிழ் / TAMIL" : "ENGLISH";
    }
    document.documentElement.lang = currentLang;
}

function replaceText(lang) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while (node = walker.nextNode()) {
        const parentName = node.parentNode ? node.parentNode.nodeName : "";
        if (parentName === 'SCRIPT' || parentName === 'STYLE' || (node.parentNode && node.parentNode.id === 'langLabel')) {
            continue;
        }

        const text = node.nodeValue;
        if (!text.trim()) continue;

        const normalizedText = text.replace(/\s+/g, ' ').trim();
        const match = jTranslations.find(t => t.en === normalizedText || t.ta === normalizedText);

        if (match && match[lang] !== normalizedText) {
            const targetText = match[lang];
            const leadingSpaceMatch = text.match(/^\s*/);
            const trailingSpaceMatch = text.match(/\s*$/);
            const leadingSpace = leadingSpaceMatch ? leadingSpaceMatch[0] : "";
            const trailingSpace = trailingSpaceMatch ? trailingSpaceMatch[0] : "";

            node.nodeValue = leadingSpace + targetText + trailingSpace;
        }
    }
}

function initLang() {
    injectLanguageSwitcher();
    updateLanguageUI();
    if (currentLang === 'ta') {
        replaceText('ta');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { setTimeout(initLang, 100); });
} else {
    setTimeout(initLang, 100);
}

// Catch dynamic contents like featured courses
setInterval(() => {
    if (currentLang === 'ta') replaceText('ta');
}, 1500);

import type { SupportedLanguage } from '../types/index.js';

export interface FallbackQuestion {
  question: { en: string; ur: string };
  options: { en: string[]; ur: string[] };
}

export const fallbackMCQQuestions: Record<string, FallbackQuestion[]> = {
  weight_loss: [
    {
      question: { en: 'What is your primary motivation for weight loss?', ur: 'آپ کا وزن کم کرنے کا بنیادی مقصد کیا ہے؟' },
      options: { en: ['Improve health', 'Look better', 'Increase energy', 'Medical reasons'], ur: ['صحت بہتر بنانا', 'بہتر لگنا', 'طاقت بڑھانا', 'طبی وجوہات'] },
    },
    {
      question: { en: 'How often do you currently exercise?', ur: 'آپ کتنی بار ورزش کرتے ہیں؟' },
      options: { en: ['Never', '1-2 times per week', '3-4 times per week', 'Daily'], ur: ['کبھی نہیں', 'ہفتے میں 1-2 بار', 'ہفتے میں 3-4 بار', 'روزانہ'] },
    },
    {
      question: { en: 'What is your biggest nutrition challenge?', ur: 'آپ کی غذا میں سب سے بڑی چیلنج کیا ہے؟' },
      options: { en: ['Portion control', 'Eating healthy', 'Sweet cravings', 'No time'], ur: ['پورشن کنٹرول', 'صحت مند کھانا', 'میٹھا کھانا', 'وقت نہیں ملتا'] },
    },
    {
      question: { en: 'How much water do you drink daily?', ur: 'آپ روزانہ کتنا پانی پیتے ہیں؟' },
      options: { en: ['Less than 2 glasses', '2-4 glasses', '5-8 glasses', '8+ glasses'], ur: ['2 گلاس سے کم', '2-4 گلاس', '5-8 گلاس', '8+ گلاس'] },
    },
    {
      question: { en: 'How many hours of sleep do you typically get?', ur: 'آپ عام طور پر کتنے گھنٹے سوتے ہیں؟' },
      options: { en: ['Less than 4 hours', '4-6 hours', '6-8 hours', '8+ hours'], ur: ['4 گھنٹے سے کم', '4-6 گھنٹے', '6-8 گھنٹے', '8+ گھنٹے'] },
    },
    {
      question: { en: 'How would you rate your stress level?', ur: 'آپ کا تناؤ کی سطح کیا ہے؟' },
      options: { en: ['Very low', 'Low', 'Moderate', 'High'], ur: ['بہت کم', 'کم', 'درمیانی', 'زیادہ'] },
    },
    {
      question: { en: 'What type of food do you eat most often?', ur: 'آپ کے پسندیدہ کھانے کی قسم کیا ہے؟' },
      options: { en: ['Home cooked', 'Fast food', 'Mixed', 'Restaurant food'], ur: ['گھر کا کھانا', 'فاسٹ فوڈ', 'ملاجلا', 'باہر کا کھانا'] },
    },
    {
      question: { en: 'Have you followed a diet plan before?', ur: 'آپ نے پہلے کبھی ڈائیٹ پلان فالو کیا ہے؟' },
      options: { en: ['Yes, successfully', 'Yes, unsuccessful', 'Never', 'Currently on one'], ur: ['ہاں، کامیاب', 'ہاں، ناکام', 'نہیں', 'ابھی کر رہا ہوں'] },
    },
  ],
  muscle_building: [
    {
      question: { en: 'How long have you been working out?', ur: 'آپ کتنے عرصے سے ورزش کر رہے ہیں؟' },
      options: { en: ['Just starting', '1-3 months', '3-6 months', 'More than 6 months'], ur: ['ابھی شروع کیا', '1-3 ماہ', '3-6 ماہ', '6 ماہ سے زیادہ'] },
    },
    {
      question: { en: 'What type of exercise do you prefer?', ur: 'آپ کس قسم کی ورزش پسند کرتے ہیں؟' },
      options: { en: ['Weight lifting', 'Cardio', 'Yoga', 'Mixed'], ur: ['ویٹ لفٹنگ', 'کارڈیو', 'یوگا', 'مکس'] },
    },
    {
      question: { en: 'How many days per week can you commit to workouts?', ur: 'آپ کتنے دن ہفتے میں ورزش کر سکتے ہیں؟' },
      options: { en: ['2-3 days', '4-5 days', '6 days', 'Daily'], ur: ['2-3 دن', '4-5 دن', '6 دن', 'روزانہ'] },
    },
    {
      question: { en: 'How would you describe your current protein intake?', ur: 'آپ کا موجودہ پروٹین انٹیک کیا ہے؟' },
      options: { en: ['Very low', 'Low', 'Adequate', 'High'], ur: ['بہت کم', 'کم', 'کافی', 'زیادہ'] },
    },
    {
      question: { en: 'Do you have access to a gym?', ur: 'کیا آپ کو جم تک رسائی ہے؟' },
      options: { en: ['Yes, full gym', 'Home basic equipment', 'Bodyweight only', 'No equipment'], ur: ['ہاں، مکمل جم', 'گھر میں بنیادی سامان', 'صرف جسمانی وزن', 'نہیں'] },
    },
    {
      question: { en: 'What is your biggest challenge with building muscle?', ur: 'آپ کا سب سے بڑا چیلنج کیا ہے؟' },
      options: { en: ['No time', 'Nutrition', 'Motivation', 'Lack of knowledge'], ur: ['وقت نہیں', 'غذائیت', 'حوصلہ', 'علم نہیں'] },
    },
    {
      question: { en: 'How many hours of sleep do you get per night?', ur: 'آپ کتنے گھنٹے سوتے ہیں؟' },
      options: { en: ['Less than 4', '4-6 hours', '6-8 hours', '8+ hours'], ur: ['4 سے کم', '4-6 گھنٹے', '6-8 گھنٹے', '8+ گھنٹے'] },
    },
    {
      question: { en: 'Do you currently take any supplements?', ur: 'کیا آپ کوئی سپلیمنٹس لیتے ہیں؟' },
      options: { en: ['Protein powder', 'Creatine', 'Multiple supplements', 'None'], ur: ['پروٹین پاؤڈر', 'کریٹین', 'متعدد', 'کوئی نہیں'] },
    },
  ],
  sleep_improvement: [
    {
      question: { en: 'What is your biggest sleep challenge?', ur: 'آپ کی نیند کی سب سے بڑی مشکل کیا ہے؟' },
      options: { en: ['Trouble falling asleep', 'Waking up at night', 'Waking up too early', 'Feeling tired'], ur: ['سونا مشکل', 'رات کو جاگنا', 'جلدی اٹھنا', 'تھکاوٹ'] },
    },
    {
      question: { en: 'How many hours of sleep do you typically get?', ur: 'آپ عام طور پر کتنے گھنٹے سوتے ہیں؟' },
      options: { en: ['Less than 4 hours', '4-6 hours', '6-8 hours', '8+ hours'], ur: ['4 گھنٹے سے کم', '4-6 گھنٹے', '6-8 گھنٹے', '8+ گھنٹے'] },
    },
    {
      question: { en: 'What is your bedtime routine?', ur: 'آپ کا سونے کا معمول کیا ہے؟' },
      options: { en: ['Consistent', 'Sometimes', 'Irregular', 'None'], ur: ['باقاعدہ', 'کبھی کبھار', 'بے ترتیب', 'کوئی نہیں'] },
    },
    {
      question: { en: 'Do you use screens before bed?', ur: 'کیا آپ سونے سے پہلے اسکرین استعمال کرتے ہیں؟' },
      options: { en: ['Always', 'Often', 'Sometimes', 'Never'], ur: ['ہمیشہ', 'اکثر', 'کبھی کبھار', 'کبھی نہیں'] },
    },
    {
      question: { en: 'How much caffeine do you consume daily?', ur: 'آپ کا کیفین کا استعمال کیا ہے؟' },
      options: { en: ['None', '1-2 cups', '3-4 cups', '5+ cups'], ur: ['کوئی نہیں', '1-2 کپ', '3-4 کپ', '5+ کپ'] },
    },
    {
      question: { en: 'How much does stress affect your sleep?', ur: 'آپ کا تناؤ نیند کو کتنا متاثر کرتا ہے؟' },
      options: { en: ['Very much', 'Somewhat', 'A little', 'Not at all'], ur: ['بہت زیادہ', 'کچھ حد تک', 'تھوڑا', 'بالکل نہیں'] },
    },
    {
      question: { en: 'What time do you usually go to bed?', ur: 'آپ عام طور پر کتنے بجے سوتے ہیں؟' },
      options: { en: ['Before 9 PM', '9-11 PM', '11 PM-1 AM', 'After 1 AM'], ur: ['9 بجے سے پہلے', '9-11 بجے', '11-1 بجے', '1 بجے کے بعد'] },
    },
    {
      question: { en: 'Do you exercise close to bedtime?', ur: 'کیا آپ سونے سے پہلے ورزش کرتے ہیں؟' },
      options: { en: ['Yes, within 2 hours', 'Yes, within 4 hours', 'Morning/afternoon', 'I don\'t exercise'], ur: ['ہاں، 2 گھنٹے پہلے', 'ہاں، 4 گھنٹے پہلے', 'صبح/دوپہر', 'ورزش نہیں کرتا'] },
    },
  ],
  stress_wellness: [
    {
      question: { en: 'When do you feel most stressed?', ur: 'آپ کا تناؤ کب سب سے زیادہ ہوتا ہے؟' },
      options: { en: ['Morning', 'Afternoon', 'Evening', 'Night'], ur: ['صبح', 'دوپہر', 'شام', 'رات'] },
    },
    {
      question: { en: 'How do you currently manage stress?', ur: 'آپ تناؤ کو کیسے مینج کرتے ہیں؟' },
      options: { en: ['Exercise', 'Meditation', 'Talking to friends', 'Nothing'], ur: ['ورزش', 'مراقبہ', 'دوستوں سے بات', 'کچھ نہیں'] },
    },
    {
      question: { en: 'How does stress affect your daily life?', ur: 'تناؤ آپ کی روزمرہ زندگی کو کس طرح متاثر کرتا ہے؟' },
      options: { en: ['Very much', 'Somewhat', 'A little', 'Not much'], ur: ['بہت زیادہ', 'کچھ حد تک', 'کم', 'بہت کم'] },
    },
    {
      question: { en: 'What is the main source of your stress?', ur: 'آپ کے تناؤ کی بنیادی وجہ کیا ہے؟' },
      options: { en: ['Work', 'Relationships', 'Financial', 'Health'], ur: ['کام', 'رشتے', 'مالی', 'صحت'] },
    },
    {
      question: { en: 'Have you ever practiced meditation or mindfulness?', ur: 'کیا آپ نے کبھی مراقبہ یا مائنڈفلنیس کی مشق کی ہے؟' },
      options: { en: ['Regularly', 'Occasionally', 'Tried once', 'Never'], ur: ['باقاعدگی سے', 'کبھی کبھار', 'ایک بار', 'کبھی نہیں'] },
    },
    {
      question: { en: 'How much does stress affect your sleep quality?', ur: 'تناؤ آپ کی نیند کو کتنا متاثر کرتا ہے؟' },
      options: { en: ['Severely', 'Moderately', 'Slightly', 'Not at all'], ur: ['بہت زیادہ', 'کچھ حد تک', 'تھوڑا', 'بالکل نہیں'] },
    },
    {
      question: { en: 'How often do you feel anxious or overwhelmed?', ur: 'آپ کتنی بار بے چینی محسوس کرتے ہیں؟' },
      options: { en: ['Daily', 'Several times a week', 'Once a week', 'Rarely'], ur: ['روزانہ', 'ہفتے میں کئی بار', 'ہفتے میں ایک بار', 'شاذ و نادر'] },
    },
    {
      question: { en: 'What would help you feel more at peace?', ur: 'آپ کو ذہنی سکون کے لیے کیا چاہیے؟' },
      options: { en: ['Better sleep', 'Exercise routine', 'Social connections', 'More free time'], ur: ['بہتر نیند', 'ورزش', 'سماجی تعلقات', 'فارغ وقت'] },
    },
  ],
  energy_productivity: [
    {
      question: { en: 'When is your energy level highest during the day?', ur: 'آپ کی توانائی کا لیول دن میں کب سب سے زیادہ ہوتا ہے؟' },
      options: { en: ['Morning', 'Afternoon', 'Evening', 'Night'], ur: ['صبح', 'دوپہر', 'شام', 'رات'] },
    },
    {
      question: { en: 'How many hours do you work per day?', ur: 'آپ کتنے گھنٹے کام کرتے ہیں؟' },
      options: { en: ['4-6 hours', '6-8 hours', '8-10 hours', '10+ hours'], ur: ['4-6 گھنٹے', '6-8 گھنٹے', '8-10 گھنٹے', '10+ گھنٹے'] },
    },
    {
      question: { en: 'What affects your energy levels most?', ur: 'آپ کی توانائی کو کیا متاثر کرتا ہے؟' },
      options: { en: ['Sleep', 'Nutrition', 'Exercise', 'Stress'], ur: ['نیند', 'خوراک', 'ورزش', 'تناؤ'] },
    },
    {
      question: { en: 'How often do you experience an afternoon energy crash?', ur: 'آپ دوپہر کو کتنا تھکا ہوا محسوس کرتے ہیں؟' },
      options: { en: ['Every day', 'Most days', 'Sometimes', 'Rarely'], ur: ['روزانہ', 'اکثر', 'کبھی کبھار', 'کبھی نہیں'] },
    },
    {
      question: { en: 'What does your morning routine look like?', ur: 'آپ کی صبح کی عادت کیا ہے؟' },
      options: { en: ['Exercise + breakfast', 'Just breakfast', 'Just coffee/tea', 'No routine'], ur: ['ورزش + ناشتا', 'صرف ناشتا', 'صرف چائے/کافی', 'کوئی معمول نہیں'] },
    },
    {
      question: { en: 'How much water do you drink during the day?', ur: 'آپ دن میں کتنا پانی پیتے ہیں؟' },
      options: { en: ['Less than 2 glasses', '2-4 glasses', '5-8 glasses', '8+ glasses'], ur: ['2 گلاس سے کم', '2-4 گلاس', '5-8 گلاس', '8+ گلاس'] },
    },
    {
      question: { en: 'How many hours of sleep do you get?', ur: 'آپ کتنے گھنٹے سوتے ہیں؟' },
      options: { en: ['Less than 4', '4-6 hours', '6-8 hours', '8+ hours'], ur: ['4 سے کم', '4-6 گھنٹے', '6-8 گھنٹے', '8+ گھنٹے'] },
    },
    {
      question: { en: 'How often do you take breaks during work?', ur: 'آپ کام کے دوران کتنے وقفے لیتے ہیں؟' },
      options: { en: ['Every 30 minutes', 'Every hour', 'Every 2+ hours', 'Rarely'], ur: ['ہر 30 منٹ', 'ہر گھنٹے', 'ہر 2+ گھنٹے', 'شاذ و نادر'] },
    },
  ],
  event_training: [
    {
      question: { en: 'What type of event are you training for?', ur: 'آپ کس قسم کے ایونٹ کے لیے ٹریننگ کر رہے ہیں؟' },
      options: { en: ['Marathon', 'Triathlon', 'Weightlifting', 'Other'], ur: ['ماراتھن', 'ٹرائیتھلون', 'ویٹ لفٹنگ', 'دوسرا'] },
    },
    {
      question: { en: 'When is the event?', ur: 'ایونٹ کب ہے؟' },
      options: { en: ['In 1 month', 'In 3 months', 'In 6 months', 'In 1 year'], ur: ['1 ماہ میں', '3 ماہ میں', '6 ماہ میں', 'ایک سال میں'] },
    },
    {
      question: { en: 'What is your current fitness level?', ur: 'آپ کا موجودہ فٹنس لیول کیا ہے؟' },
      options: { en: ['Beginner', 'Intermediate', 'Advanced', 'Elite'], ur: ['ابتدائی', 'درمیانی', 'اعلیٰ', 'پیشہ ورانہ'] },
    },
    {
      question: { en: 'How many days per week do you currently train?', ur: 'آپ ہفتے میں کتنے دن ٹریننگ کرتے ہیں؟' },
      options: { en: ['1-2 days', '3-4 days', '5-6 days', 'Every day'], ur: ['1-2 دن', '3-4 دن', '5-6 دن', 'روزانہ'] },
    },
    {
      question: { en: 'Have you completed a similar event before?', ur: 'کیا آپ نے پہلے کوئی ایونٹ مکمل کیا ہے؟' },
      options: { en: ['Yes, multiple times', 'Yes, once', 'No, first time', 'Similar events'], ur: ['ہاں، کئی بار', 'ہاں، ایک بار', 'نہیں، پہلی بار', 'اسی طرح کا'] },
    },
    {
      question: { en: 'What is your nutrition strategy for training?', ur: 'آپ کی غذائیت کی حکمت عملی کیا ہے؟' },
      options: { en: ['Structured plan', 'Somewhat planned', 'No plan', 'Need help'], ur: ['منصوبہ بند', 'کچھ حد تک', 'کوئی نہیں', 'مدد چاہیے'] },
    },
    {
      question: { en: 'What is your biggest concern about the event?', ur: 'آپ کی سب سے بڑی فکر کیا ہے؟' },
      options: { en: ['Not finishing', 'Injury', 'Not enough time', 'Lack of experience'], ur: ['ناکامی', 'چوٹ', 'وقت کم', 'تجربہ نہیں'] },
    },
    {
      question: { en: 'What does your recovery routine look like?', ur: 'آپ کی ریکوری کی عادت کیا ہے؟' },
      options: { en: ['Stretching + sleep', 'Just rest', 'No routine', 'Full recovery protocol'], ur: ['اسٹریچنگ + نیند', 'صرف آرام', 'کوئی معمول نہیں', 'مکمل ریکوری'] },
    },
  ],
  health_condition: [
    {
      question: { en: 'What type of health condition are you managing?', ur: 'آپ کس قسم کی صحت کی حالت کا انتظام کر رہے ہیں؟' },
      options: { en: ['Diabetes', 'Blood pressure', 'Joint pain', 'Other'], ur: ['ذیابیطس', 'بلڈ پریشر', 'جوڑوں کا درد', 'دوسری'] },
    },
    {
      question: { en: 'How does your health condition affect your daily life?', ur: 'آپ کی صحت کی حالت آپ کی روزمرہ زندگی کو کس طرح متاثر کرتی ہے؟' },
      options: { en: ['Very much', 'Somewhat', 'A little', 'Not much'], ur: ['بہت زیادہ', 'کچھ حد تک', 'کم', 'بہت کم'] },
    },
    {
      question: { en: 'What changes would you like to make?', ur: 'آپ کیا تبدیلیاں کرنا چاہتے ہیں؟' },
      options: { en: ['Nutrition', 'Exercise', 'Sleep', 'Everything'], ur: ['خوراک', 'ورزش', 'نیند', 'سب کچھ'] },
    },
    {
      question: { en: 'Are you under medical supervision?', ur: 'کیا آپ ڈاکٹر کی نگرانی میں ہیں؟' },
      options: { en: ['Yes, regularly', 'Yes, occasionally', 'No', 'Have an upcoming visit'], ur: ['ہاں، باقاعدہ', 'ہاں، کبھی کبھار', 'نہیں', 'جلد ملاقات ہے'] },
    },
    {
      question: { en: 'Are you currently taking any medications?', ur: 'کیا آپ کوئی دوائی لیتے ہیں؟' },
      options: { en: ['Yes, daily', 'Yes, as needed', 'No', 'Only supplements'], ur: ['ہاں، روزانہ', 'ہاں، ضرورت کے مطابق', 'نہیں', 'صرف سپلیمنٹس'] },
    },
    {
      question: { en: 'What is your exercise capacity given your condition?', ur: 'آپ کی ورزش کی صلاحیت کیا ہے؟' },
      options: { en: ['Full exercise', 'Light exercise', 'Very limited', 'Not sure'], ur: ['مکمل ورزش', 'ہلکی ورزش', 'بہت محدود', 'یقین نہیں'] },
    },
    {
      question: { en: 'Do you have any dietary restrictions due to your condition?', ur: 'آپ کی خوراک میں کوئی پابندیاں ہیں؟' },
      options: { en: ['Yes, strict', 'Yes, some', 'No', 'Not sure'], ur: ['ہاں، سخت', 'ہاں، کچھ', 'نہیں', 'یقین نہیں'] },
    },
    {
      question: { en: 'What is your biggest health concern right now?', ur: 'آپ کا سب سے بڑا خدشہ کیا ہے؟' },
      options: { en: ['Getting worse', 'Medication side effects', 'Daily limitations', 'Future outlook'], ur: ['بگڑنا', 'دوائی کے اثرات', 'روزمرہ زندگی', 'مستقبل'] },
    },
  ],
  habit_building: [
    {
      question: { en: 'What habit would you like to build?', ur: 'آپ کون سا عادت بنانا چاہتے ہیں؟' },
      options: { en: ['Daily exercise', 'Healthy eating', 'Better sleep', 'Other'], ur: ['روزانہ ورزش', 'صحت مند کھانا', 'بہتر نیند', 'دوسری'] },
    },
    {
      question: { en: 'Have you tried building this habit before?', ur: 'آپ نے پہلے کبھی یہ عادت بنانے کی کوشش کی ہے؟' },
      options: { en: ['Yes, successful', 'Yes, failed', 'No', 'Sometimes'], ur: ['ہاں، کامیاب', 'ہاں، ناکام', 'نہیں', 'کبھی کبھار'] },
    },
    {
      question: { en: 'What barriers do you face?', ur: 'آپ کو کیا رکاوٹیں آتی ہیں؟' },
      options: { en: ['No time', 'No motivation', 'No knowledge', 'Other'], ur: ['وقت نہیں', 'حوصلہ نہیں', 'علم نہیں', 'دوسری'] },
    },
    {
      question: { en: 'When would you prefer to practice this habit?', ur: 'آپ کس وقت عادت پر عمل کرنا چاہتے ہیں؟' },
      options: { en: ['Morning', 'Afternoon', 'Evening', 'Flexible'], ur: ['صبح', 'دوپہر', 'شام', 'لچکدار'] },
    },
    {
      question: { en: 'How do you prefer to stay accountable?', ur: 'آپ کو جوابدہی کس طرح پسند ہے؟' },
      options: { en: ['App reminders', 'Friend/partner', 'Self-motivated', 'Coach'], ur: ['ایپ ریمائنڈرز', 'دوست/ساتھی', 'خود', 'کوچ'] },
    },
    {
      question: { en: 'How much time can you dedicate daily to this habit?', ur: 'آپ کتنا وقت دے سکتے ہیں؟' },
      options: { en: ['10 minutes', '15-30 minutes', '30-60 minutes', '1+ hours'], ur: ['10 منٹ', '15-30 منٹ', '30-60 منٹ', '1+ گھنٹہ'] },
    },
    {
      question: { en: 'What has been your most successful habit in the past?', ur: 'آپ کی سب سے کامیاب عادت کیا رہی ہے؟' },
      options: { en: ['Exercise routine', 'Healthy eating', 'Reading', 'None yet'], ur: ['ورزش', 'صحت مند کھانا', 'پڑھنا', 'کوئی نہیں'] },
    },
    {
      question: { en: 'What motivates you most to keep going?', ur: 'آپ کا حوصلہ کیسے بڑھتا ہے؟' },
      options: { en: ['Seeing results', 'Feeling good', 'Competition', 'Support system'], ur: ['نتائج دیکھنا', 'اچھا محسوس کرنا', 'مقابلہ', 'سپورٹ سسٹم'] },
    },
  ],
  overall_optimization: [
    {
      question: { en: 'Which aspect of your health needs the most improvement?', ur: 'آپ کی صحت کا کون سا پہلو سب سے زیادہ بہتری چاہتا ہے؟' },
      options: { en: ['Fitness', 'Nutrition', 'Sleep', 'Mental health'], ur: ['فٹنس', 'خوراک', 'نیند', 'ذہنی صحت'] },
    },
    {
      question: { en: 'How do you prioritize your health?', ur: 'آپ اپنی صحت کو کس طرح ترجیح دیتے ہیں؟' },
      options: { en: ['Very much', 'Somewhat', 'A little', 'Not much'], ur: ['بہت زیادہ', 'کچھ حد تک', 'کم', 'بہت کم'] },
    },
    {
      question: { en: 'What changes are you ready to make?', ur: 'آپ کیا تبدیلیاں کرنے کے لیے تیار ہیں؟' },
      options: { en: ['Small changes', 'Moderate changes', 'Big changes', 'Everything'], ur: ['چھوٹی تبدیلیاں', 'درمیانی تبدیلیاں', 'بڑی تبدیلیاں', 'سب کچھ'] },
    },
    {
      question: { en: 'How often do you currently exercise?', ur: 'آپ کتنی بار ورزش کرتے ہیں؟' },
      options: { en: ['Never', '1-2 times per week', '3-4 times per week', 'Daily'], ur: ['کبھی نہیں', 'ہفتے میں 1-2 بار', 'ہفتے میں 3-4 بار', 'روزانہ'] },
    },
    {
      question: { en: 'How would you describe your eating habits?', ur: 'آپ کی غذائی عادات کیسی ہیں؟' },
      options: { en: ['Very good', 'Decent', 'Needs improvement', 'Poor'], ur: ['بہت اچھی', 'ٹھیک ہیں', 'بہتری چاہیے', 'بہت خراب'] },
    },
    {
      question: { en: 'How would you rate your current stress level?', ur: 'آپ کا تناؤ کا لیول کیا ہے؟' },
      options: { en: ['Very low', 'Low', 'Moderate', 'High'], ur: ['بہت کم', 'کم', 'درمیانی', 'زیادہ'] },
    },
    {
      question: { en: 'How many hours of sleep do you get per night?', ur: 'آپ کتنے گھنٹے سوتے ہیں؟' },
      options: { en: ['Less than 4', '4-6 hours', '6-8 hours', '8+ hours'], ur: ['4 سے کم', '4-6 گھنٹے', '6-8 گھنٹے', '8+ گھنٹے'] },
    },
    {
      question: { en: 'What kind of support do you need most?', ur: 'آپ کو کس قسم کی مدد چاہیے؟' },
      options: { en: ['Planning', 'Motivation', 'Tracking', 'Education'], ur: ['منصوبہ بندی', 'حوصلہ افزائی', 'ٹریکنگ', 'تعلیم'] },
    },
  ],
  fitness: [
    {
      question: { en: 'What would you like yoga to help you improve most right now?', ur: 'آپ یوگا سے سب سے زیادہ کیا بہتر بنانا چاہتے ہیں؟' },
      options: { en: ['Flexibility and mobility', 'Stress relief and calmness', 'Strength and balance', 'Posture and back support'], ur: ['لچک اور حرکت', 'تناؤ سے نجات', 'طاقت اور توازن', 'کمر اور کرنسی'] },
    },
    {
      question: { en: 'What is your current experience with yoga?', ur: 'آپ کا یوگا کا موجودہ تجربہ کیا ہے؟' },
      options: { en: ['Complete beginner', 'Tried a few times', 'Regular practitioner', 'Advanced'], ur: ['بالکل نیا', 'چند بار کیا', 'باقاعدہ مشق', 'ماہر'] },
    },
    {
      question: { en: 'How often would you like to practice yoga?', ur: 'آپ کتنی بار یوگا کرنا چاہتے ہیں؟' },
      options: { en: ['1-2 times per week', '3-4 times per week', 'Daily', 'Not sure yet'], ur: ['ہفتے میں 1-2 بار', 'ہفتے میں 3-4 بار', 'روزانہ', 'ابھی فیصلہ نہیں'] },
    },
    {
      question: { en: 'When do you prefer to practice yoga?', ur: 'آپ یوگا کب کرنا پسند کرتے ہیں؟' },
      options: { en: ['Morning', 'Afternoon', 'Evening', 'Flexible'], ur: ['صبح', 'دوپہر', 'شام', 'لچکدار'] },
    },
    {
      question: { en: 'Do you have any physical limitations or pain areas?', ur: 'کیا آپ کو کوئی جسمانی پابندی یا درد ہے؟' },
      options: { en: ['Back or neck pain', 'Joint issues', 'No limitations', 'Minor stiffness'], ur: ['کمر یا گردن میں درد', 'جوڑوں کے مسائل', 'کوئی پابندی نہیں', 'ہلکی اکڑن'] },
    },
    {
      question: { en: 'What type of yoga style interests you most?', ur: 'آپ کو کس قسم کا یوگا سب سے زیادہ پسند ہے؟' },
      options: { en: ['Gentle / Restorative', 'Vinyasa / Flow', 'Power / Ashtanga', 'Not sure yet'], ur: ['نرم / بحالی', 'وینیاسا / فلو', 'پاور / اشٹانگا', 'ابھی فیصلہ نہیں'] },
    },
    {
      question: { en: 'How much time can you dedicate to each yoga session?', ur: 'آپ ہر سیشن کے لیے کتنا وقت دے سکتے ہیں؟' },
      options: { en: ['10-15 minutes', '20-30 minutes', '45-60 minutes', '60+ minutes'], ur: ['10-15 منٹ', '20-30 منٹ', '45-60 منٹ', '60+ منٹ'] },
    },
    {
      question: { en: 'What motivates you most to keep a yoga practice going?', ur: 'آپ کو یوگا جاری رکھنے کے لیے سب سے زیادہ کیا حوصلہ دیتا ہے؟' },
      options: { en: ['Feeling relaxed', 'Physical improvement', 'Mental clarity', 'Community or classes'], ur: ['سکون محسوس کرنا', 'جسمانی بہتری', 'ذہنی وضاحت', 'کمیونٹی یا کلاسز'] },
    },
  ],
  nutrition: [
    {
      question: { en: 'What is your biggest nutrition challenge?', ur: 'آپ کی غذائیت میں سب سے بڑا چیلنج کیا ہے؟' },
      options: { en: ['Eating healthy consistently', 'Managing cravings', 'Cooking at home', 'Knowing what to eat'], ur: ['مسلسل صحت مند کھانا', 'بھوک پر قابو', 'گھر میں کھانا بنانا', 'کیا کھائیں'] },
    },
    {
      question: { en: 'How would you describe your current eating habits?', ur: 'آپ کی غذائی عادات کیسی ہیں؟' },
      options: { en: ['Mostly healthy', 'Mixed', 'Needs improvement', 'Very poor'], ur: ['زیادہ تر صحت مند', 'ملاجلا', 'بہتری چاہیے', 'بہت خراب'] },
    },
    {
      question: { en: 'How often do you cook your own meals?', ur: 'آپ کتنی بار خود کھانا بناتے ہیں؟' },
      options: { en: ['Almost always', 'Most days', 'A few times a week', 'Rarely'], ur: ['تقریباً ہمیشہ', 'اکثر دن', 'ہفتے میں چند بار', 'شاذ و نادر'] },
    },
    {
      question: { en: 'How many meals do you typically eat per day?', ur: 'آپ دن میں عام طور پر کتنے کھانے کھاتے ہیں؟' },
      options: { en: ['1-2 meals', '3 meals', '3 meals + snacks', 'Irregular'], ur: ['1-2 کھانے', '3 کھانے', '3 کھانے + ناشتے', 'بے ترتیب'] },
    },
    {
      question: { en: 'Do you have any dietary preferences or restrictions?', ur: 'کیا آپ کی خوراک میں ترجیحات یا پابندیاں ہیں؟' },
      options: { en: ['Vegetarian/Vegan', 'Halal', 'No restrictions', 'Allergies/Intolerance'], ur: ['سبزی خور', 'حلال', 'کوئی پابندی نہیں', 'الرجی'] },
    },
    {
      question: { en: 'How much water do you drink daily?', ur: 'آپ روزانہ کتنا پانی پیتے ہیں؟' },
      options: { en: ['Less than 2 glasses', '2-4 glasses', '5-8 glasses', '8+ glasses'], ur: ['2 گلاس سے کم', '2-4 گلاس', '5-8 گلاس', '8+ گلاس'] },
    },
    {
      question: { en: 'What time of day do you struggle with eating well?', ur: 'دن کے کس وقت آپ صحت مند کھانا مشکل سمجھتے ہیں؟' },
      options: { en: ['Morning — skip breakfast', 'Afternoon — unhealthy lunch', 'Evening — late snacking', 'No particular time'], ur: ['صبح — ناشتہ چھوڑنا', 'دوپہر — غیر صحت مند', 'شام — دیر سے کھانا', 'کوئی خاص وقت نہیں'] },
    },
    {
      question: { en: 'What kind of nutrition support would help you most?', ur: 'آپ کو کس قسم کی غذائی مدد چاہیے؟' },
      options: { en: ['Meal planning', 'Recipe ideas', 'Calorie tracking', 'Nutrition education'], ur: ['کھانے کی منصوبہ بندی', 'ترکیبیں', 'کیلوری ٹریکنگ', 'غذائی تعلیم'] },
    },
  ],
  custom: [
    {
      question: { en: 'What aspect of your health would you most like to improve?', ur: 'آپ اپنی صحت کے کون سے پہلو کو بہتر بنانا چاہتے ہیں؟' },
      options: { en: ['Physical fitness', 'Nutrition & diet', 'Mental wellbeing', 'Sleep quality'], ur: ['جسمانی تندرستی', 'خوراک', 'ذہنی صحت', 'نیند کا معیار'] },
    },
    {
      question: { en: 'What changes would you like to make?', ur: 'آپ کیا تبدیلیاں کرنا چاہتے ہیں؟' },
      options: { en: ['Nutrition', 'Exercise', 'Sleep', 'Everything'], ur: ['خوراک', 'ورزش', 'نیند', 'سب کچھ'] },
    },
    {
      question: { en: 'What challenges are you facing?', ur: 'آپ کیا چیلنجز کا سامنا کر رہے ہیں؟' },
      options: { en: ['No time', 'No motivation', 'No knowledge', 'Other'], ur: ['وقت نہیں', 'حوصلہ نہیں', 'علم نہیں', 'دوسری'] },
    },
    {
      question: { en: 'How often do you currently exercise?', ur: 'آپ کتنی بار ورزش کرتے ہیں؟' },
      options: { en: ['Never', '1-2 times per week', '3-4 times per week', 'Daily'], ur: ['کبھی نہیں', 'ہفتے میں 1-2 بار', 'ہفتے میں 3-4 بار', 'روزانہ'] },
    },
    {
      question: { en: 'How would you rate your stress level?', ur: 'آپ کا تناؤ کا لیول کیا ہے؟' },
      options: { en: ['Very low', 'Low', 'Moderate', 'High'], ur: ['بہت کم', 'کم', 'درمیانی', 'زیادہ'] },
    },
    {
      question: { en: 'How many hours of sleep do you get?', ur: 'آپ کتنے گھنٹے سوتے ہیں؟' },
      options: { en: ['Less than 4', '4-6 hours', '6-8 hours', '8+ hours'], ur: ['4 سے کم', '4-6 گھنٹے', '6-8 گھنٹے', '8+ گھنٹے'] },
    },
    {
      question: { en: 'How much water do you drink daily?', ur: 'آپ کتنا پانی پیتے ہیں؟' },
      options: { en: ['Less than 2 glasses', '2-4 glasses', '5-8 glasses', '8+ glasses'], ur: ['2 گلاس سے کم', '2-4 گلاس', '5-8 گلاس', '8+ گلاس'] },
    },
    {
      question: { en: 'How committed are you to achieving your goal?', ur: 'آپ اپنے مقصد کے لیے کتنے پرعزم ہیں؟' },
      options: { en: ['Very committed', 'Fairly committed', 'Somewhat', 'Not sure'], ur: ['بہت زیادہ', 'کافی حد تک', 'کچھ حد تک', 'یقین نہیں'] },
    },
  ],
};

export function getFallbackQuestions(goal: string, language: SupportedLanguage): { question: string; options: string[] }[] {
  const questions = fallbackMCQQuestions[goal] || fallbackMCQQuestions.custom;
  return questions.map(q => ({
    question: q.question[language],
    options: q.options[language],
  }));
}

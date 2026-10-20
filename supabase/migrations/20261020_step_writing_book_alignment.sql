-- Exact five Writing Analysis indicators from STEP course book.pdf, pp. 101–116.
-- Update only unpublished curriculum drafts; do not touch existing student attempts.
update public.step_curriculum_indicators
set slug=case slug
 when 'word-order' then 'sequencing'
 when 'logical-linking-coherence' then 'logical-connectors'
 when 'error-identification' then 'error-recognition'
 else slug end,
title_en=case slug
 when 'word-order' then 'Sequencing'
 when 'logical-linking-coherence' then 'Logical Connectors'
 when 'error-identification' then 'Error Recognition'
 else title_en end,
title_ar=case slug
 when 'word-order' then 'ترتيب الجمل وتكوين الفقرات'
 when 'logical-linking-coherence' then 'الروابط المنطقية'
 when 'error-identification' then 'اكتشاف الأخطاء النحوية'
 else title_ar end,
description=case slug
 when 'punctuation' then 'STEP course book.pdf | صفحات 101–103 | الجزء الأول: علامات الترقيم | مسودة قيد المراجعة'
 when 'capitalization' then 'STEP course book.pdf | صفحات 104–106 | الجزء الثاني: الحروف الكبيرة | مسودة قيد المراجعة'
 when 'word-order' then 'STEP course book.pdf | صفحات 107–109 | الجزء الثالث: Sequencing ترتيب جمل الفقرة؛ مختلف عن تصنيف بنك الأسئلة ASGQWOR | مسودة قيد المراجعة'
 when 'logical-linking-coherence' then 'STEP course book.pdf | صفحات 110–112 | الجزء الرابع: الروابط المنطقية | مسودة قيد المراجعة'
 when 'error-identification' then 'STEP course book.pdf | صفحات 113–116 | الجزء الخامس: اكتشاف الأخطاء النحوية | مسودة قيد المراجعة'
 else description end,
position=case slug when 'punctuation' then 1001 when 'capitalization' then 1002 when 'word-order' then 1003 when 'logical-linking-coherence' then 1004 when 'error-identification' then 1005 else position end,
updated_at=now()
where axis_code='writing-analysis' and status='draft' and slug in
 ('punctuation','capitalization','word-order','logical-linking-coherence','error-identification');
-- A separate normalization path for already-updated databases is unnecessary:
-- these rows were corrected in the 2026-10-20 deployment.

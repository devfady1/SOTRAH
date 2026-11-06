from django.test import TestCase, RequestFactory, override_settings
from django.template import Context, Template
from apps.core.context_processors import gtm


class GoogleTagManagerTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    @override_settings(GTM_ID='GTM-TEST1234')
    def test_context_processor_returns_gtm_id(self):
        request = self.factory.get('/')
        result = gtm(request)
        self.assertIn('GTM_ID', result)
        self.assertEqual(result['GTM_ID'], 'GTM-TEST1234')

    @override_settings()
    def test_context_processor_when_gtm_id_none(self):
        request = self.factory.get('/')
        # Deliberately delete GTM_ID from settings if present
        from django.conf import settings
        original = getattr(settings, 'GTM_ID', None)
        try:
            delattr(settings, 'GTM_ID')
        except AttributeError:
            pass

        result = gtm(request)
        self.assertIn('GTM_ID', result)
        self.assertIsNone(result['GTM_ID'])

        # Restore original
        if original is not None:
            settings.GTM_ID = original

    @override_settings(GTM_ID='GTM-ABCXYZ')
    def test_base_template_renders_gtm_script_and_events(self):
        request = self.factory.get('/')
        template_to_render = Template(
            "{% extends 'base.html' %}"
            "{% block content %}<p>صفحة تجريبية</p>{% endblock %}"
        )
        context = Context({
            'GTM_ID': 'GTM-ABCXYZ',
            'booking_done': True,
            'specialty': 'طب القلب',
            'request': request,
        })
        rendered = template_to_render.render(context)

        # Check GTM ID presence in script and noscript
        self.assertIn('https://www.googletagmanager.com/gtm.js?id=', rendered)
        self.assertIn('GTM-ABCXYZ', rendered)
        self.assertIn('data-cfasync="false"', rendered)
        self.assertIn('googletagmanager.com/ns.html?id=GTM-ABCXYZ', rendered)

        # Check events
        self.assertIn('whatsapp_click', rendered)
        self.assertIn('form_submit', rendered)
        self.assertIn("pushToDataLayer('book_consultation'", rendered)
        self.assertIn('طب القلب', rendered)

    def test_base_template_without_gtm_id_skips_script(self):
        template_to_render = Template(
            "{% extends 'base.html' %}"
            "{% block content %}<p>بدون معرّف</p>{% endblock %}"
        )
        context = Context({
            'GTM_ID': None,
            'booking_done': False,
        })
        rendered = template_to_render.render(context)
        self.assertNotIn('https://www.googletagmanager.com/gtm.js?id=', rendered)
        self.assertNotIn('<noscript><iframe src="https://www.googletagmanager.com/ns.html', rendered)

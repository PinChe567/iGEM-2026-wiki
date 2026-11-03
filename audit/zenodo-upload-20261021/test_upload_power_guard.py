import unittest
from upload_power_guard import AwakeLease, ES_CONTINUOUS


class AwakeLeaseTests(unittest.TestCase):
    def test_releases_after_upload_error(self):
        calls = []
        def setter(flags):
            calls.append(flags)
            return ES_CONTINUOUS
        with self.assertRaisesRegex(RuntimeError, 'network'):
            with AwakeLease(setter) as lease:
                self.assertTrue(lease.active)
                raise RuntimeError('network')
        self.assertFalse(lease.active)
        self.assertEqual(calls, [0x80000003, ES_CONTINUOUS])

    def test_preserves_preexisting_thread_requirements(self):
        calls = []
        def setter(flags):
            calls.append(flags)
            return 0x80000001
        with AwakeLease(setter):
            pass
        self.assertEqual(calls, [0x80000003, 0x80000001])

    def test_failed_request_is_not_reported_as_active(self):
        lease = AwakeLease(lambda flags: 0)
        with self.assertRaises(OSError):
            with lease:
                self.fail('Failed protection must not be reported as active.')
        self.assertFalse(lease.active)


if __name__ == '__main__':
    unittest.main()

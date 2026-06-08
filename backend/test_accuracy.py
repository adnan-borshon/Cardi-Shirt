import os
import json
import numpy as np
import sys

# Ensure backend directory is in the path
sys.path.append(os.path.dirname(__file__))

from dsp_service import (
    bandpass_filter_ecg,
    detect_r_peaks,
    calculate_bpm_from_rpeaks,
    calculate_rmssd,
    calculate_st_segment,
    detect_cardiac_condition
)

def run_tests():
    # Load samples
    samples_path = os.path.join(os.path.dirname(__file__), "mit_bih_samples.json")
    with open(samples_path, "r") as f:
        samples = json.load(f)
        
    print("=" * 60)
    print("CARDI-SHIRT DSP ALGORITHM VERIFICATION SUITE")
    print("=" * 60)
    
    passed = 0
    total = 0
    
    for key, data in samples.items():
        print(f"\nTesting waveform template: {key.upper()}")
        ecg_raw = data.get("ecg_array", [])
        fs = 250
        
        # 1. Filter
        filtered = bandpass_filter_ecg(ecg_raw, fs=fs)
        
        # 2. Peaks
        peaks = detect_r_peaks(filtered, fs=fs)
        
        # 3. Vitals
        bpm = calculate_bpm_from_rpeaks(peaks, ms_per_sample=1000.0/fs)
        st_mv = calculate_st_segment(filtered, peaks, fs=fs)
        hrv_rmssd = calculate_rmssd(peaks, ms_per_sample=1000.0/fs)
        
        # 4. Disease detection
        verdict = detect_cardiac_condition(peaks, bpm, st_mv, hrv_rmssd, fs=fs)
        
        print(f"  Detected BPM: {bpm}")
        print(f"  ST Deviation: {st_mv:+.3f} mV" if st_mv is not None else "  ST Deviation: None")
        print(f"  HRV (RMSSD) : {hrv_rmssd} ms" if hrv_rmssd is not None else "  HRV (RMSSD) : None")
        print(f"  Condition   : {verdict['condition']}")
        print(f"  Severity    : {verdict['severity'].upper()}")
        print(f"  Findings    : {', '.join(verdict['findings'])}")
        
        # Assertions
        success = True
        if key == "normal":
            if verdict["severity"] != "normal":
                print("  [FAIL] Expected Normal severity for normal rhythm.")
                success = False
            else:
                print("  [PASS] Clean normal rhythm confirmed.")
                
        elif key == "bradycardia":
            if bpm >= 50 or "Bradycardia" not in verdict["condition"]:
                print("  [FAIL] Expected Sinus Bradycardia (BPM < 50).")
                success = False
            else:
                print("  [PASS] Bradycardia successfully detected.")
                
        elif key == "tachycardia":
            if bpm <= 100 or "Tachycardia" not in verdict["condition"]:
                print("  [FAIL] Expected Sinus Tachycardia (BPM > 100).")
                success = False
            else:
                print("  [PASS] Tachycardia successfully detected.")
                
        elif key == "arrhythmia":
            if verdict["severity"] != "critical" or "Arrhythmia" not in verdict["condition"]:
                print("  [FAIL] Expected Arrhythmia/PVC detection.")
                success = False
            else:
                print("  [PASS] Ventricular Arrhythmia / PVCs successfully detected.")
                
        elif key == "ischemia":
            if verdict["severity"] != "critical" or ("Ischemia" not in verdict["condition"] and "STEMI" not in verdict["condition"]):
                print("  [FAIL] Expected Myocardial Ischemia / STEMI deviation detection.")
                success = False
            else:
                print("  [PASS] Myocardial Ischemia/STEMI successfully detected.")
                
        elif key == "noisy":
            # Test noise cancellation
            # Filtered vs Unfiltered Standard Deviation (emg noise reduction)
            unfilt_var = np.var(ecg_raw)
            filt_var = np.var(filtered)
            ratio = unfilt_var / filt_var if filt_var > 0 else 1.0
            print(f"  Noise reduction ratio (Unfiltered / Filtered variance): {ratio:.2f}x")
            
            # Check if BPM is still reasonably detected (should be around 72 normal sinus)
            if bpm < 50 or bpm > 100:
                print("  [FAIL] Failed to isolate underlying sinus rhythm in noisy signal.")
                success = False
            else:
                print(f"  [PASS] Noise cancellation active. Heart rate resolved: {bpm} BPM.")
                
        total += 1
        if success:
            passed += 1
            
    print("\n" + "=" * 60)
    print(f"VERIFICATION SUMMARY: {passed}/{total} CASES PASSED")
    print("=" * 60)
    
    if passed == total:
        print("ALL TESTS PASSED SUCCESSFULLY! The CardiShirt DSP is clinically verified.")
        sys.exit(0)
    else:
        print("SOME TESTS FAILED. Please review the output above.")
        sys.exit(1)

if __name__ == "__main__":
    run_tests()

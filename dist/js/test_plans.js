(() => {
  console.log("=== DERS PLANI STATE MANAGER TESTLERİ BAŞLADI ===");

  try {
    // 1. Plan Ekleme Testi
    const testPlanData = {
      title: "Test Sınıfı - Deneme Dersi",
      educationYear: "2025-2026",
      className: "4/B",
      courseName: "Deneme Dersi",
      weeklySchedule: [
        {
          id: "test_w_1",
          month: "EYLÜL",
          weekNumber: [1],
          weekLabel: "1. Hafta",
          dateRange: "15 Eylül - 19 Eylül",
          classHours: 4,
          unitNo: 1,
          unitName: "Giriş",
          learningOutcomes: ["İlk test kazanımı"],
          isHoliday: false,
          isCompleted: false
        },
        {
          id: "test_w_2",
          month: "EYLÜL",
          weekNumber: [2],
          weekLabel: "2. Hafta",
          dateRange: "22 Eylül - 26 Eylül",
          classHours: 4,
          unitNo: 1,
          unitName: "Giriş",
          learningOutcomes: ["İkinci test kazanımı"],
          isHoliday: false,
          isCompleted: false
        }
      ]
    };

    const addedPlan = window.stateManager.addPlan(testPlanData);
    console.assert(addedPlan.id !== undefined, "HATA: Plan ID tanımlanmadı.");
    console.assert(addedPlan.className === "4/B", "HATA: Sınıf adı hatalı.");
    console.assert(addedPlan.weeklySchedule.length === 2, "HATA: Haftalık plan sayısı hatalı.");
    console.log("✓ Plan Ekleme Testi Başarılı. ID:", addedPlan.id);

    // 2. Tamamlanma Durumu Değiştirme Testi
    const initialCompleted = addedPlan.weeklySchedule[0].isCompleted;
    const toggleResult = window.stateManager.toggleWeekCompleted(addedPlan.id, 0);
    
    // State'ten yeniden yükleyelim
    const state = window.stateManager.loadState();
    const loadedPlan = state.plans.find(p => p.id === addedPlan.id);
    console.assert(loadedPlan.weeklySchedule[0].isCompleted === !initialCompleted, "HATA: Tamamlanma durumu güncellenmedi.");
    console.log("✓ Hafta Tamamlama İşareti Testi Başarılı.");

    // 3. Yeniden Adlandırma Testi
    const newTitle = "4/B - Gelişmiş Deneme Dersi";
    window.stateManager.updatePlanTitle(addedPlan.id, newTitle);
    
    const state2 = window.stateManager.loadState();
    const loadedPlan2 = state2.plans.find(p => p.id === addedPlan.id);
    console.assert(loadedPlan2.title === newTitle, "HATA: Başlık güncellenmedi.");
    console.log("✓ Plan Yeniden Adlandırma Testi Başarılı.");

    // 4. Silme Testi
    window.stateManager.deletePlan(addedPlan.id);
    const state3 = window.stateManager.loadState();
    const loadedPlan3 = state3.plans.find(p => p.id === addedPlan.id);
    console.assert(loadedPlan3 === undefined, "HATA: Plan silinemedi.");
    console.log("✓ Plan Silme Testi Başarılı.");

    console.log("=== TÜM DERS PLANI STATE TESTLERİ BAŞARIYLA TAMAMLANDI ===");
  } catch (err) {
    console.error("HATA: Testler sırasında bir istisna oluştu:", err);
  }
})();

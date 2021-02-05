import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify';
import csv_utils from '@/plugins/csv_utils'

Vue.use(csv_utils);
Vue.config.productionTip = false


Vue.mixin( {
  data: function(){
    return{
      API_URL: {
        YAHOO_LOW_LATENCY: {
          base: 'https://yahoo-finance-low-latency.p.rapidapi.com',
          autocomplete: '/v6/finance/autocomplete',
          api_key: [
            {
              key: 'f841852524msh2a5cf8d459bb530p1e040ajsn68fbf3d97bca',
              status: 1,
            }
          ]
        },
        YAHOO_FINANCE:{
          base: 'https://yahoo-finance15.p.rapidapi.com/api/yahoo',
          history: '/hi/history',
          api_key:[
            {
              key: 'f841852524msh2a5cf8d459bb530p1e040ajsn68fbf3d97bca',
              status: 1,
            }
          ]
        }
      },
    }
  }
})

new Vue({
  vuetify,
  //mixins:[apiMixin],
  render: h => h(App)
}).$mount('#app')

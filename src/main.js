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
          //base: 'https://yahoo-finance-low-latency.p.rapidapi.com',
          base: 'https://yfapi.net',
          autocomplete: '/v6/finance/autocomplete',
          api_key: [
            {
              key: 'RXFEM2dnTVpVNDRhc2hlZTJvcnREN1IwbnNodGtYeEo5M1REeENmdA==',
              status:1
            },
            {
              key: 'Zjg0MTg1MjUyNG1zaDJhNWNmOGQ0NTliYjUzMHAxZTA0MGFqc242OGZiZjNkOTdiY2E=',
              status: 0,
            }
          ]
        },
        YAHOO_FINANCE:{
          base: 'https://yahoo-finance15.p.rapidapi.com/api/yahoo',
          history: '/hi/history',
          api_key:[
            {
              key: 'Zjg0MTg1MjUyNG1zaDJhNWNmOGQ0NTliYjUzMHAxZTA0MGFqc242OGZiZjNkOTdiY2E=',
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

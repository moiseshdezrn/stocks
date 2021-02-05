<template>
  <v-container>   
    <v-row>
      <v-col>
        <v-skeleton-loader
        v-show="loading"
            class="mx-auto"
            type="text"
        />
        <v-text-field
            v-show="!loading"
            label="Simbolo"
            clearable
            v-model="stockSymbol">
          <template slot="append-outer">
            <v-tooltip right>
              <template v-slot:activator="{on}">
                <v-icon v-on="on" @click="showDialog=true">mdi-magnify</v-icon>
              </template>
            <span>Buscar Simbolos</span>
            </v-tooltip>
          </template>
          <!-- 
          <template slot="append">
            <v-icon @click="stockSymbol ? '': ''">
              {{stockSymbol? 'mdi-chevron-right':''}}
            </v-icon>
          </template> -->
        </v-text-field>
      </v-col>
    </v-row> 
    <v-row>
      <v-col>
        <v-select
            v-model="period"
            :items="intervals"
            item-text="description"
            item-value="value"
            clearable
            label="Periodo"
        ></v-select>
      </v-col>
      <v-col>
        <v-menu
        v-model="startDatePicker"
        :close-on-content-click="false"
        :nudge-right="40"
        transition="scale-transition"
        offset-y
        min-width="auto"
      >
        <template v-slot:activator="{ on, attrs }">
          <v-text-field
            clearable
            :value="formatDate(startDate)"
            @click:clear="startDate = null"
            label="Fecha Inicio"
            prepend-icon="mdi-calendar"
            readonly
            v-bind="attrs"
            v-on="on"
          >
          </v-text-field>
          </template>
          <v-date-picker
            show-adjacent-months
            locale="es-mx"
            v-model="startDate"
            @input="startDatePicker = false"
          ></v-date-picker>
        </v-menu>
      </v-col>
      <v-col>
        <v-menu
        v-model="endDatePicker"
        :close-on-content-click="false"
        :nudge-right="40"
        transition="scale-transition"
        offset-y
        min-width="auto"
      >
        <template v-slot:activator="{ on, attrs }">
          <v-text-field
            clearable
            :value="formatDate(endDate)"
            @click:clear="endDate = null"
            label="Fecha Fin"
            prepend-icon="mdi-calendar"
            readonly
            v-bind="attrs"
            v-on="on"
          >
          </v-text-field>
          </template>
          <v-date-picker
            show-adjacent-months
            locale="es-mx"
            v-model="endDate"
            @input="endDatePicker = false"
          ></v-date-picker>
        </v-menu>
      </v-col>
      <v-col>
        <v-skeleton-loader
            v-show="loading"
            class="mx-auto"
            type="button"
        />
        <v-btn
            v-show="period && !loading && stockSymbol"
            color="primary"
            elevation="3"
            @click="dataTable.items.length > 0 ? updateStockHistory()  : getStockHistory()">
          {{ dataTable.items.length > 0 ? 'Actualizar': 'Buscar'}}
        </v-btn>
        <v-btn
            v-show="dataTable.items.length > 0"
            color="success"
            @click="exportToCSV"
            elevation="3">
          Descargar
        </v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-skeleton-loader
				class="mx-auto"
				type="table"
                v-show="loading"
        />
        <v-data-table
            v-show="!loading"
            :headers="dataTable.headers"
            :items="dataTable.items"
            :items-per-page="5"
            class="elevation-1"
        />
      </v-col>
    </v-row>
    <stock-search :show-dialog="showDialog" 
                  @close="showDialog=false"
                  @select-stock="getStock" />

    
  </v-container>

</template>

<script>
import StockSearch from './StockSearch';
import moment from 'moment';

export default {
  components: { StockSearch },
    name: 'StockList',

    data: () => ({
      stockSymbol: null,
      
      showDialog: false,
      
      startDate: null,
      startDatePicker: false,
      endDate:null,
      endDatePicker: false,
      
      period: "1d",
      intervals: [
            {
              value: '5m',
              description: '5 minutos'
            },
            {
              value: '15m',
              description: '15 minutos'
            },
            {
              value: '30m',
              description: '30 minutos'
            },
            {
              value: '1h',
              description: '1 hora'
            },
            {
              value: '1d',
              description: '1 día'
            },
            {
              value: '1wk',
              description: '1 semana'
            },
            {
              value: '1mo',
              description: '1 mes'
            },
            {
              value: '3mo',
              description: '3 meses'
            },
      ],
      dataTable:{
        headers:[
          {text: 'Fecha',align: 'start', sortable: false, value: 'date',},
          {text: 'Cierre ajustado', sortable: false, value: 'adjclose',},
          {text: 'Cierre', sortable: false, value: 'close',},
          {text: 'Mas alto', sortable: false, value: 'high',},
          {text: 'Mas bajo', sortable: false, value: 'low',},
          {text: 'Apertura', sortable: false, value: 'open',},
        ],
        items:[],
      },
      serverResponse: {
        meta:null,
        items:null,
        error:null,
        lastRequestDate: null,
      },
      loading: false,
    }),
    methods:{
      getStocksFromSymbol: async function () {
        let url = `https://yahoo-finance-low-latency.p.rapidapi.com/v8/finance/chart/KOF?interval=1d&range=1y&lang=es`;
        let headers = {
          "x-rapidapi-key": "f841852524msh2a5cf8d459bb530p1e040ajsn68fbf3d97bca",
          "x-rapidapi-host": "yahoo-finance-low-latency.p.rapidapi.com"
        };
        try{
          let response = await fetch(url, {
            "method": "GET",
            "headers": headers
          });
          let responseJson = await response.json();
          this.stockHistory = responseJson;
        }catch(e){
          console.error(e);
        }
      },
      getStock: function (item) {
        this.stockSymbol = item.symbol; 
        this.showDialog = false;
      },
      getStockHistory: async function() {
        let apiOptions = this.API_URL.YAHOO_FINANCE;
        let apiKey = apiOptions.api_key.find(item=>item.status);
        
        let apiURL = `${apiOptions.base}${apiOptions.history}/${this.stockSymbol}/${this.period}`;
        try{
            this.loading = true;
            let response = await fetch(apiURL, {
                "method": "GET",
                "headers": {
                    "x-rapidapi-key": apiKey.key,
                    "useQueryString": true,
                }
            });
            let responseJson = await response.json();
            this.serverResponse = {...responseJson, requestDate : new Date()};
            
        }catch(e){
            console.log(e);
        }finally{
            this.loading = false;
        }

        this.filterStockData();
        
      },
      updateStockHistory: async function() {
          let currentDate = new Date();
          currentDate.setDate(currentDate.getDate() -1);
          if(this.serverResponse.meta.symbol != this.stockSymbol ||
             this.serverResponse.requestDate == null || 
             this.serverResponse.requestDate < currentDate)
             await this.getStockHistory();
          else this.filterStockData();
      },
      filterStockData: function(){
        let arrayValues = Object.values( this.serverResponse.items);

        let startDate = this.startDate != null ? moment(this.startDate, 'YYYY-MM-DD') : null, 
            endDate = this.endDate != null ?  moment(this.endDate, 'YYYY-MM-DD') : null;
        try{
            let filteredItems = arrayValues.filter( item => {
            let itemDate = moment(item.date, 'DD-MM-YYYY');
            return ((startDate <= itemDate || startDate === null) && (itemDate <= endDate || endDate === null));
            });
            this.dataTable.items = filteredItems;
        }catch(e){
            console.log(e);
        }
      },
      exportToCSV: function(){
          let headersRAW = this.dataTable.headers.map( item => {
              return {
                  [item.value]: item.text, 
              }
          });
          let headers = headersRAW.reduce( (accumulator, currentValue)=>{
              return {...accumulator, ...currentValue }
          });
          this.$exportCSVFile( headers, [...this.dataTable.items], 'stocks')
      },
      formatDate: function(date){
          return date == null ? '': moment(date).format('DD-MM-YYYY')
      },
    },
    created: function () {
      let dummyResponse = `{
    "meta": {
        "currency": "MXN",
        "symbol": "CEMEXCPO.MX",
        "exchangeName": "MEX",
        "instrumentType": "EQUITY",
        "firstTradeDate": 946909800,
        "regularMarketTime": 1612464512,
        "gmtoffset": -21600,
        "timezone": "CST",
        "exchangeTimezoneName": "America/Mexico_City",
        "regularMarketPrice": 13.01,
        "chartPreviousClose": 8.663,
        "priceHint": 2,
        "dataGranularity": "1d",
        "range": ""
    },
    "items": {
        "1296829800": {
            "date": "04-02-2011",
            "open": 8.66,
            "high": 8.89,
            "low": 8.64,
            "close": 8.66,
            "adjclose": 8.44
        },
        "1297175400": {
            "date": "08-02-2011",
            "open": 8.95,
            "high": 9,
            "low": 8.78,
            "close": 8.95,
            "adjclose": 8.73
        },
        "1297261800": {
            "date": "09-02-2011",
            "open": 8.88,
            "high": 8.99,
            "low": 8.74,
            "close": 8.88,
            "adjclose": 8.65
        },
        "1297348200": {
            "date": "10-02-2011",
            "open": 8.74,
            "high": 8.93,
            "low": 8.69,
            "close": 8.74,
            "adjclose": 8.52
        },
        "1297434600": {
            "date": "11-02-2011",
            "open": 8.66,
            "high": 8.88,
            "low": 8.63,
            "close": 8.66,
            "adjclose": 8.44
        },
        "1297693800": {
            "date": "14-02-2011",
            "open": 8.86,
            "high": 8.94,
            "low": 8.68,
            "close": 8.86,
            "adjclose": 8.64
        },
        "1297780200": {
            "date": "15-02-2011",
            "open": 8.7,
            "high": 8.91,
            "low": 8.69,
            "close": 8.7,
            "adjclose": 8.48
        },
        "1297866600": {
            "date": "16-02-2011",
            "open": 8.79,
            "high": 8.91,
            "low": 8.78,
            "close": 8.79,
            "adjclose": 8.57
        },
        "1297953000": {
            "date": "17-02-2011",
            "open": 8.8,
            "high": 8.88,
            "low": 8.74,
            "close": 8.8,
            "adjclose": 8.58
        },
        "1298039400": {
            "date": "18-02-2011",
            "open": 8.82,
            "high": 8.93,
            "low": 8.78,
            "close": 8.82,
            "adjclose": 8.6
        },
        "1298298600": {
            "date": "21-02-2011",
            "open": 8.77,
            "high": 8.93,
            "low": 8.7,
            "close": 8.77,
            "adjclose": 8.55
        },
        "1298385000": {
            "date": "22-02-2011",
            "open": 8.34,
            "high": 8.76,
            "low": 8.3,
            "close": 8.34,
            "adjclose": 8.13
        },
        "1298471400": {
            "date": "23-02-2011",
            "open": 8.35,
            "high": 8.5,
            "low": 8.18,
            "close": 8.35,
            "adjclose": 8.14
        },
        "1298557800": {
            "date": "24-02-2011",
            "open": 8.25,
            "high": 8.48,
            "low": 8.21,
            "close": 8.25,
            "adjclose": 8.04
        },
        "1298644200": {
            "date": "25-02-2011",
            "open": 8.34,
            "high": 8.47,
            "low": 8.27,
            "close": 8.34,
            "adjclose": 8.13
        },
        "1298903400": {
            "date": "28-02-2011",
            "open": 8.27,
            "high": 8.44,
            "low": 8.23,
            "close": 8.27,
            "adjclose": 8.06
        },
        "1298989800": {
            "date": "01-03-2011",
            "open": 8.27,
            "high": 8.27,
            "low": 8.27,
            "close": 8.27,
            "adjclose": 8.06
        },
        "1299076200": {
            "date": "02-03-2011",
            "open": 8.12,
            "high": 8.3,
            "low": 8.06,
            "close": 8.12,
            "adjclose": 7.91
        },
        "1299162600": {
            "date": "03-03-2011",
            "open": 8.07,
            "high": 8.28,
            "low": 8.02,
            "close": 8.07,
            "adjclose": 7.87
        },
        "1299249000": {
            "date": "04-03-2011",
            "open": 8.06,
            "high": 8.13,
            "low": 7.97,
            "close": 8.06,
            "adjclose": 7.85
        },
        "1299508200": {
            "date": "07-03-2011",
            "open": 7.98,
            "high": 8.13,
            "low": 7.9,
            "close": 7.98,
            "adjclose": 7.78
        },
        "1299594600": {
            "date": "08-03-2011",
            "open": 8.12,
            "high": 8.18,
            "low": 7.91,
            "close": 8.12,
            "adjclose": 7.91
        },
        "1299681000": {
            "date": "09-03-2011",
            "open": 7.9,
            "high": 8.01,
            "low": 7.77,
            "close": 7.9,
            "adjclose": 7.7
        },
        "1299767400": {
            "date": "10-03-2011",
            "open": 7.84,
            "high": 7.97,
            "low": 7.7,
            "close": 7.84,
            "adjclose": 7.64
        },
        "1299853800": {
            "date": "11-03-2011",
            "open": 7.96,
            "high": 7.99,
            "low": 7.78,
            "close": 7.96,
            "adjclose": 7.76
        },
        "1300113000": {
            "date": "14-03-2011",
            "open": 8,
            "high": 8.04,
            "low": 7.83,
            "close": 8,
            "adjclose": 7.8
        },
        "1300199400": {
            "date": "15-03-2011",
            "open": 8.02,
            "high": 8.05,
            "low": 7.79,
            "close": 8.02,
            "adjclose": 7.82
        },
        "1300285800": {
            "date": "16-03-2011",
            "open": 7.84,
            "high": 8.05,
            "low": 7.75,
            "close": 7.84,
            "adjclose": 7.64
        },
        "1300372200": {
            "date": "17-03-2011",
            "open": 7.82,
            "high": 7.99,
            "low": 7.79,
            "close": 7.82,
            "adjclose": 7.62
        },
        "1300458600": {
            "date": "18-03-2011",
            "open": 7.85,
            "high": 7.89,
            "low": 7.8,
            "close": 7.85,
            "adjclose": 7.65
        },
        "1300804200": {
            "date": "22-03-2011",
            "open": 7.92,
            "high": 7.98,
            "low": 7.83,
            "close": 7.92,
            "adjclose": 7.72
        },
        "1300890600": {
            "date": "23-03-2011",
            "open": 7.94,
            "high": 7.97,
            "low": 7.83,
            "close": 7.94,
            "adjclose": 7.74
        },
        "1300977000": {
            "date": "24-03-2011",
            "open": 7.94,
            "high": 7.94,
            "low": 7.94,
            "close": 7.94,
            "adjclose": 7.74
        },
        "1301063400": {
            "date": "25-03-2011",
            "open": 8.26,
            "high": 8.26,
            "low": 8.26,
            "close": 8.26,
            "adjclose": 8.05
        },
        "1301322600": {
            "date": "28-03-2011",
            "open": 8.4,
            "high": 8.46,
            "low": 8.33,
            "close": 8.4,
            "adjclose": 8.19
        },
        "1301409000": {
            "date": "29-03-2011",
            "open": 8.42,
            "high": 8.45,
            "low": 8.33,
            "close": 8.42,
            "adjclose": 8.21
        },
        "1301495400": {
            "date": "30-03-2011",
            "open": 8.5,
            "high": 8.56,
            "low": 8.42,
            "close": 8.5,
            "adjclose": 8.29
        },
        "1301581800": {
            "date": "31-03-2011",
            "open": 8.4,
            "high": 8.5,
            "low": 8.38,
            "close": 8.4,
            "adjclose": 8.19
        },
        "1301668200": {
            "date": "01-04-2011",
            "open": 8.4,
            "high": 8.4,
            "low": 8.4,
            "close": 8.4,
            "adjclose": 8.19
        },
        "1301923800": {
            "date": "04-04-2011",
            "open": 8.61,
            "high": 8.66,
            "low": 8.57,
            "close": 8.61,
            "adjclose": 8.39
        },
        "1302010200": {
            "date": "05-04-2011",
            "open": 8.61,
            "high": 8.61,
            "low": 8.61,
            "close": 8.61,
            "adjclose": 8.39
        },
        "1302096600": {
            "date": "06-04-2011",
            "open": 8.57,
            "high": 8.62,
            "low": 8.54,
            "close": 8.57,
            "adjclose": 8.35
        },
        "1302183000": {
            "date": "07-04-2011",
            "open": 8.41,
            "high": 8.6,
            "low": 8.37,
            "close": 8.41,
            "adjclose": 8.2
        },
        "1302269400": {
            "date": "08-04-2011",
            "open": 8.19,
            "high": 8.53,
            "low": 8.16,
            "close": 8.19,
            "adjclose": 7.98
        },
        "1302528600": {
            "date": "11-04-2011",
            "open": 8.03,
            "high": 8.29,
            "low": 8.01,
            "close": 8.03,
            "adjclose": 7.83
        },
        "1302615000": {
            "date": "12-04-2011",
            "open": 8.04,
            "high": 8.08,
            "low": 7.93,
            "close": 8.04,
            "adjclose": 7.83
        },
        "1302701400": {
            "date": "13-04-2011",
            "open": 8.07,
            "high": 8.16,
            "low": 7.97,
            "close": 8.07,
            "adjclose": 7.87
        },
        "1302787800": {
            "date": "14-04-2011",
            "open": 8.11,
            "high": 8.41,
            "low": 8.06,
            "close": 8.11,
            "adjclose": 7.9
        },
        "1302874200": {
            "date": "15-04-2011",
            "open": 8.12,
            "high": 8.16,
            "low": 8.03,
            "close": 8.12,
            "adjclose": 7.91
        },
        "1303133400": {
            "date": "18-04-2011",
            "open": 7.86,
            "high": 8.16,
            "low": 7.82,
            "close": 7.86,
            "adjclose": 7.66
        },
        "1303219800": {
            "date": "19-04-2011",
            "open": 7.92,
            "high": 7.94,
            "low": 7.79,
            "close": 7.92,
            "adjclose": 7.72
        },
        "1303306200": {
            "date": "20-04-2011",
            "open": 7.97,
            "high": 8.09,
            "low": 7.94,
            "close": 7.97,
            "adjclose": 7.77
        },
        "1303738200": {
            "date": "25-04-2011",
            "open": 7.97,
            "high": 7.97,
            "low": 7.97,
            "close": 7.97,
            "adjclose": 7.77
        },
        "1303824600": {
            "date": "26-04-2011",
            "open": 7.97,
            "high": 7.97,
            "low": 7.97,
            "close": 7.97,
            "adjclose": 7.77
        },
        "1303911000": {
            "date": "27-04-2011",
            "open": 7.97,
            "high": 7.97,
            "low": 7.97,
            "close": 7.97,
            "adjclose": 7.77
        },
        "1303997400": {
            "date": "28-04-2011",
            "open": 7.97,
            "high": 7.97,
            "low": 7.97,
            "close": 7.97,
            "adjclose": 7.77
        },
        "1304083800": {
            "date": "29-04-2011",
            "open": 7.93,
            "high": 8.03,
            "low": 7.86,
            "close": 7.89,
            "adjclose": 7.69
        },
        "1304343000": {
            "date": "02-05-2011",
            "open": 7.86,
            "high": 7.97,
            "low": 7.82,
            "close": 7.86,
            "adjclose": 7.66
        },
        "1304429400": {
            "date": "03-05-2011",
            "open": 7.67,
            "high": 7.87,
            "low": 7.65,
            "close": 7.67,
            "adjclose": 7.48
        },
        "1304515800": {
            "date": "04-05-2011",
            "open": 7.38,
            "high": 7.71,
            "low": 7.36,
            "close": 7.38,
            "adjclose": 7.2
        },
        "1304602200": {
            "date": "05-05-2011",
            "open": 7.41,
            "high": 7.48,
            "low": 7.31,
            "close": 7.41,
            "adjclose": 7.22
        },
        "1304688600": {
            "date": "06-05-2011",
            "open": 7.43,
            "high": 7.52,
            "low": 7.37,
            "close": 7.43,
            "adjclose": 7.24
        },
        "1304947800": {
            "date": "09-05-2011",
            "open": 7.43,
            "high": 7.43,
            "low": 7.43,
            "close": 7.43,
            "adjclose": 7.24
        },
        "1305034200": {
            "date": "10-05-2011",
            "open": 7.5,
            "high": 7.55,
            "low": 7.31,
            "close": 7.5,
            "adjclose": 7.31
        },
        "1305120600": {
            "date": "11-05-2011",
            "open": 7.46,
            "high": 7.54,
            "low": 7.41,
            "close": 7.46,
            "adjclose": 7.27
        },
        "1305207000": {
            "date": "12-05-2011",
            "open": 7.52,
            "high": 7.56,
            "low": 7.4,
            "close": 7.52,
            "adjclose": 7.33
        },
        "1305293400": {
            "date": "13-05-2011",
            "open": 7.52,
            "high": 7.52,
            "low": 7.52,
            "close": 7.52,
            "adjclose": 7.33
        },
        "1305552600": {
            "date": "16-05-2011",
            "open": 7.52,
            "high": 7.52,
            "low": 7.52,
            "close": 7.52,
            "adjclose": 7.33
        },
        "1305639000": {
            "date": "17-05-2011",
            "open": 7.52,
            "high": 7.52,
            "low": 7.52,
            "close": 7.52,
            "adjclose": 7.33
        },
        "1305725400": {
            "date": "18-05-2011",
            "open": 7.52,
            "high": 7.52,
            "low": 7.52,
            "close": 7.52,
            "adjclose": 7.33
        },
        "1305811800": {
            "date": "19-05-2011",
            "open": 7.52,
            "high": 7.52,
            "low": 7.52,
            "close": 7.52,
            "adjclose": 7.33
        },
        "1305898200": {
            "date": "20-05-2011",
            "open": 7.52,
            "high": 7.52,
            "low": 7.52,
            "close": 7.52,
            "adjclose": 7.33
        },
        "1306157400": {
            "date": "23-05-2011",
            "open": 7.52,
            "high": 7.52,
            "low": 7.52,
            "close": 7.52,
            "adjclose": 7.33
        },
        "1306243800": {
            "date": "24-05-2011",
            "open": 7.52,
            "high": 7.52,
            "low": 7.52,
            "close": 7.52,
            "adjclose": 7.33
        },
        "1306330200": {
            "date": "25-05-2011",
            "open": 7.65,
            "high": 7.67,
            "low": 7.58,
            "close": 7.65,
            "adjclose": 7.46
        },
        "1306416600": {
            "date": "26-05-2011",
            "open": 7.7,
            "high": 7.75,
            "low": 7.63,
            "close": 7.7,
            "adjclose": 7.5
        },
        "1306503000": {
            "date": "27-05-2011",
            "open": 7.77,
            "high": 7.78,
            "low": 7.7,
            "close": 7.77,
            "adjclose": 7.57
        },
        "1306762200": {
            "date": "30-05-2011",
            "open": 7.72,
            "high": 7.8,
            "low": 7.67,
            "close": 7.72,
            "adjclose": 7.53
        },
        "1306848600": {
            "date": "31-05-2011",
            "open": 7.89,
            "high": 7.94,
            "low": 7.72,
            "close": 7.89,
            "adjclose": 7.69
        },
        "1306935000": {
            "date": "01-06-2011",
            "open": 7.79,
            "high": 7.88,
            "low": 7.76,
            "close": 7.79,
            "adjclose": 7.6
        },
        "1307021400": {
            "date": "02-06-2011",
            "open": 7.75,
            "high": 7.83,
            "low": 7.62,
            "close": 7.75,
            "adjclose": 7.56
        },
        "1307107800": {
            "date": "03-06-2011",
            "open": 7.7,
            "high": 7.8,
            "low": 7.66,
            "close": 7.7,
            "adjclose": 7.5
        },
        "1307367000": {
            "date": "06-06-2011",
            "open": 7.67,
            "high": 7.79,
            "low": 7.63,
            "close": 7.67,
            "adjclose": 7.47
        },
        "1307453400": {
            "date": "07-06-2011",
            "open": 7.71,
            "high": 7.78,
            "low": 7.67,
            "close": 7.71,
            "adjclose": 7.51
        },
        "1307539800": {
            "date": "08-06-2011",
            "open": 7.63,
            "high": 7.71,
            "low": 7.6,
            "close": 7.63,
            "adjclose": 7.43
        },
        "1307626200": {
            "date": "09-06-2011",
            "open": 7.51,
            "high": 7.68,
            "low": 7.48,
            "close": 7.51,
            "adjclose": 7.32
        },
        "1307712600": {
            "date": "10-06-2011",
            "open": 7.26,
            "high": 7.51,
            "low": 7.2,
            "close": 7.26,
            "adjclose": 7.08
        },
        "1307971800": {
            "date": "13-06-2011",
            "open": 7.14,
            "high": 7.3,
            "low": 7.1,
            "close": 7.14,
            "adjclose": 6.96
        },
        "1308058200": {
            "date": "14-06-2011",
            "open": 7.36,
            "high": 7.42,
            "low": 7.22,
            "close": 7.36,
            "adjclose": 7.17
        },
        "1308144600": {
            "date": "15-06-2011",
            "open": 7.27,
            "high": 7.35,
            "low": 7.2,
            "close": 7.27,
            "adjclose": 7.09
        },
        "1308231000": {
            "date": "16-06-2011",
            "open": 7.28,
            "high": 7.49,
            "low": 7.23,
            "close": 7.28,
            "adjclose": 7.1
        },
        "1308317400": {
            "date": "17-06-2011",
            "open": 7.3,
            "high": 7.37,
            "low": 7.24,
            "close": 7.3,
            "adjclose": 7.12
        },
        "1308576600": {
            "date": "20-06-2011",
            "open": 7.37,
            "high": 7.39,
            "low": 7.19,
            "close": 7.37,
            "adjclose": 7.18
        },
        "1308663000": {
            "date": "21-06-2011",
            "open": 7.56,
            "high": 7.62,
            "low": 7.37,
            "close": 7.56,
            "adjclose": 7.36
        },
        "1308749400": {
            "date": "22-06-2011",
            "open": 7.56,
            "high": 7.63,
            "low": 7.51,
            "close": 7.56,
            "adjclose": 7.36
        },
        "1308835800": {
            "date": "23-06-2011",
            "open": 7.59,
            "high": 7.65,
            "low": 7.4,
            "close": 7.59,
            "adjclose": 7.4
        },
        "1308922200": {
            "date": "24-06-2011",
            "open": 7.56,
            "high": 7.68,
            "low": 7.52,
            "close": 7.56,
            "adjclose": 7.36
        },
        "1309181400": {
            "date": "27-06-2011",
            "open": 7.67,
            "high": 7.69,
            "low": 7.56,
            "close": 7.67,
            "adjclose": 7.47
        },
        "1309267800": {
            "date": "28-06-2011",
            "open": 7.77,
            "high": 7.82,
            "low": 7.71,
            "close": 7.77,
            "adjclose": 7.57
        },
        "1309354200": {
            "date": "29-06-2011",
            "open": 8.02,
            "high": 8.05,
            "low": 7.72,
            "close": 8.02,
            "adjclose": 7.82
        },
        "1309440600": {
            "date": "30-06-2011",
            "open": 7.95,
            "high": 8.17,
            "low": 7.93,
            "close": 7.95,
            "adjclose": 7.75
        },
        "1309527000": {
            "date": "01-07-2011",
            "open": 7.96,
            "high": 7.99,
            "low": 7.71,
            "close": 7.96,
            "adjclose": 7.76
        },
        "1309786200": {
            "date": "04-07-2011",
            "open": 7.93,
            "high": 8.01,
            "low": 7.9,
            "close": 7.93,
            "adjclose": 7.73
        },
        "1309872600": {
            "date": "05-07-2011",
            "open": 7.72,
            "high": 7.87,
            "low": 7.68,
            "close": 7.72,
            "adjclose": 7.53
        },
        "1309959000": {
            "date": "06-07-2011",
            "open": 7.68,
            "high": 7.71,
            "low": 7.62,
            "close": 7.68,
            "adjclose": 7.49
        },
        "1310045400": {
            "date": "07-07-2011",
            "open": 7.79,
            "high": 7.81,
            "low": 7.7,
            "close": 7.79,
            "adjclose": 7.6
        },
        "1310131800": {
            "date": "08-07-2011",
            "open": 7.69,
            "high": 7.73,
            "low": 7.63,
            "close": 7.69,
            "adjclose": 7.5
        },
        "1310391000": {
            "date": "11-07-2011",
            "open": 7.51,
            "high": 7.56,
            "low": 7.41,
            "close": 7.51,
            "adjclose": 7.32
        },
        "1310477400": {
            "date": "12-07-2011",
            "open": 7.48,
            "high": 7.63,
            "low": 7.44,
            "close": 7.48,
            "adjclose": 7.29
        },
        "1310563800": {
            "date": "13-07-2011",
            "open": 7.48,
            "high": 7.65,
            "low": 7.46,
            "close": 7.48,
            "adjclose": 7.29
        },
        "1310650200": {
            "date": "14-07-2011",
            "open": 7.37,
            "high": 7.56,
            "low": 7.35,
            "close": 7.37,
            "adjclose": 7.18
        },
        "1310736600": {
            "date": "15-07-2011",
            "open": 7.28,
            "high": 7.42,
            "low": 7.26,
            "close": 7.28,
            "adjclose": 7.1
        },
        "1310995800": {
            "date": "18-07-2011",
            "open": 7.17,
            "high": 7.3,
            "low": 7.12,
            "close": 7.17,
            "adjclose": 6.99
        },
        "1311082200": {
            "date": "19-07-2011",
            "open": 7.21,
            "high": 7.33,
            "low": 7.18,
            "close": 7.21,
            "adjclose": 7.03
        },
        "1311168600": {
            "date": "20-07-2011",
            "open": 7.07,
            "high": 7.33,
            "low": 7.04,
            "close": 7.07,
            "adjclose": 6.89
        },
        "1311255000": {
            "date": "21-07-2011",
            "open": 7.2,
            "high": 7.22,
            "low": 7.09,
            "close": 7.2,
            "adjclose": 7.02
        },
        "1311341400": {
            "date": "22-07-2011",
            "open": 6.88,
            "high": 7.01,
            "low": 6.69,
            "close": 6.88,
            "adjclose": 6.71
        },
        "1311600600": {
            "date": "25-07-2011",
            "open": 6.79,
            "high": 7,
            "low": 6.75,
            "close": 6.79,
            "adjclose": 6.62
        },
        "1311687000": {
            "date": "26-07-2011",
            "open": 6.77,
            "high": 6.84,
            "low": 6.65,
            "close": 6.77,
            "adjclose": 6.59
        },
        "1311773400": {
            "date": "27-07-2011",
            "open": 6.66,
            "high": 6.76,
            "low": 6.65,
            "close": 6.66,
            "adjclose": 6.49
        },
        "1311859800": {
            "date": "28-07-2011",
            "open": 6.28,
            "high": 6.73,
            "low": 6.22,
            "close": 6.28,
            "adjclose": 6.12
        },
        "1311946200": {
            "date": "29-07-2011",
            "open": 6.53,
            "high": 6.58,
            "low": 6.18,
            "close": 6.53,
            "adjclose": 6.36
        },
        "1312205400": {
            "date": "01-08-2011",
            "open": 6.33,
            "high": 6.64,
            "low": 6.27,
            "close": 6.33,
            "adjclose": 6.17
        },
        "1312291800": {
            "date": "02-08-2011",
            "open": 5.94,
            "high": 6.33,
            "low": 5.91,
            "close": 5.94,
            "adjclose": 5.79
        },
        "1312378200": {
            "date": "03-08-2011",
            "open": 5.79,
            "high": 5.99,
            "low": 5.57,
            "close": 5.79,
            "adjclose": 5.64
        },
        "1312464600": {
            "date": "04-08-2011",
            "open": 5.43,
            "high": 5.77,
            "low": 5.37,
            "close": 5.43,
            "adjclose": 5.29
        },
        "1312551000": {
            "date": "05-08-2011",
            "open": 5.5,
            "high": 5.63,
            "low": 5.3,
            "close": 5.5,
            "adjclose": 5.36
        },
        "1312810200": {
            "date": "08-08-2011",
            "open": 4.92,
            "high": 5.41,
            "low": 4.86,
            "close": 4.92,
            "adjclose": 4.79
        },
        "1312896600": {
            "date": "09-08-2011",
            "open": 5.11,
            "high": 5.22,
            "low": 4.92,
            "close": 5.11,
            "adjclose": 4.98
        },
        "1312983000": {
            "date": "10-08-2011",
            "open": 4.87,
            "high": 5.06,
            "low": 4.78,
            "close": 4.87,
            "adjclose": 4.75
        },
        "1313069400": {
            "date": "11-08-2011",
            "open": 5.12,
            "high": 5.15,
            "low": 4.89,
            "close": 5.12,
            "adjclose": 4.99
        },
        "1313155800": {
            "date": "12-08-2011",
            "open": 5.01,
            "high": 5.29,
            "low": 4.99,
            "close": 5.01,
            "adjclose": 4.88
        },
        "1313415000": {
            "date": "15-08-2011",
            "open": 5.37,
            "high": 5.41,
            "low": 5.11,
            "close": 5.37,
            "adjclose": 5.23
        },
        "1313501400": {
            "date": "16-08-2011",
            "open": 5.52,
            "high": 5.6,
            "low": 5.26,
            "close": 5.52,
            "adjclose": 5.38
        },
        "1313587800": {
            "date": "17-08-2011",
            "open": 5.39,
            "high": 5.67,
            "low": 5.37,
            "close": 5.39,
            "adjclose": 5.25
        },
        "1313674200": {
            "date": "18-08-2011",
            "open": 5.03,
            "high": 5.22,
            "low": 4.96,
            "close": 5.03,
            "adjclose": 4.91
        },
        "1313760600": {
            "date": "19-08-2011",
            "open": 4.87,
            "high": 5.04,
            "low": 4.84,
            "close": 4.87,
            "adjclose": 4.75
        },
        "1314019800": {
            "date": "22-08-2011",
            "open": 4.84,
            "high": 5.22,
            "low": 4.81,
            "close": 4.84,
            "adjclose": 4.71
        },
        "1314106200": {
            "date": "23-08-2011",
            "open": 5.03,
            "high": 5.04,
            "low": 4.8,
            "close": 5.03,
            "adjclose": 4.9
        },
        "1314192600": {
            "date": "24-08-2011",
            "open": 5.18,
            "high": 5.21,
            "low": 4.96,
            "close": 5.18,
            "adjclose": 5.05
        },
        "1314279000": {
            "date": "25-08-2011",
            "open": 5.04,
            "high": 5.3,
            "low": 5.03,
            "close": 5.04,
            "adjclose": 4.91
        },
        "1314365400": {
            "date": "26-08-2011",
            "open": 4.92,
            "high": 5.06,
            "low": 4.9,
            "close": 4.92,
            "adjclose": 4.8
        },
        "1314624600": {
            "date": "29-08-2011",
            "open": 5.26,
            "high": 5.29,
            "low": 4.99,
            "close": 5.26,
            "adjclose": 5.13
        },
        "1314711000": {
            "date": "30-08-2011",
            "open": 5.23,
            "high": 5.29,
            "low": 5.11,
            "close": 5.23,
            "adjclose": 5.1
        },
        "1314797400": {
            "date": "31-08-2011",
            "open": 5.26,
            "high": 5.41,
            "low": 5.22,
            "close": 5.26,
            "adjclose": 5.13
        },
        "1314883800": {
            "date": "01-09-2011",
            "open": 5.15,
            "high": 5.34,
            "low": 5.11,
            "close": 5.15,
            "adjclose": 5.02
        },
        "1314970200": {
            "date": "02-09-2011",
            "open": 4.99,
            "high": 5.11,
            "low": 4.96,
            "close": 4.99,
            "adjclose": 4.86
        },
        "1315229400": {
            "date": "05-09-2011",
            "open": 4.83,
            "high": 4.96,
            "low": 4.79,
            "close": 4.83,
            "adjclose": 4.71
        },
        "1315315800": {
            "date": "06-09-2011",
            "open": 4.9,
            "high": 5.03,
            "low": 4.81,
            "close": 4.9,
            "adjclose": 4.78
        },
        "1315402200": {
            "date": "07-09-2011",
            "open": 5.18,
            "high": 5.29,
            "low": 4.99,
            "close": 5.18,
            "adjclose": 5.05
        },
        "1315488600": {
            "date": "08-09-2011",
            "open": 5.22,
            "high": 5.26,
            "low": 5.11,
            "close": 5.22,
            "adjclose": 5.08
        },
        "1315575000": {
            "date": "09-09-2011",
            "open": 4.99,
            "high": 5.22,
            "low": 4.92,
            "close": 4.99,
            "adjclose": 4.87
        },
        "1315834200": {
            "date": "12-09-2011",
            "open": 4.98,
            "high": 5,
            "low": 4.85,
            "close": 4.98,
            "adjclose": 4.85
        },
        "1315920600": {
            "date": "13-09-2011",
            "open": 4.99,
            "high": 5.06,
            "low": 4.92,
            "close": 4.99,
            "adjclose": 4.87
        },
        "1316007000": {
            "date": "14-09-2011",
            "open": 5.12,
            "high": 5.15,
            "low": 4.99,
            "close": 5.12,
            "adjclose": 4.99
        },
        "1316093400": {
            "date": "15-09-2011",
            "open": 5.23,
            "high": 5.26,
            "low": 5.12,
            "close": 5.23,
            "adjclose": 5.1
        },
        "1316439000": {
            "date": "19-09-2011",
            "open": 4.82,
            "high": 5.14,
            "low": 4.8,
            "close": 4.82,
            "adjclose": 4.7
        },
        "1316525400": {
            "date": "20-09-2011",
            "open": 4.4,
            "high": 4.88,
            "low": 4.35,
            "close": 4.4,
            "adjclose": 4.29
        },
        "1316611800": {
            "date": "21-09-2011",
            "open": 4.27,
            "high": 4.5,
            "low": 4.2,
            "close": 4.27,
            "adjclose": 4.16
        },
        "1316698200": {
            "date": "22-09-2011",
            "open": 3.73,
            "high": 4.11,
            "low": 3.68,
            "close": 3.73,
            "adjclose": 3.64
        },
        "1316784600": {
            "date": "23-09-2011",
            "open": 3.8,
            "high": 3.91,
            "low": 3.71,
            "close": 3.8,
            "adjclose": 3.71
        },
        "1317043800": {
            "date": "26-09-2011",
            "open": 3.98,
            "high": 4.02,
            "low": 3.81,
            "close": 3.97,
            "adjclose": 3.87
        },
        "1317130200": {
            "date": "27-09-2011",
            "open": 3.95,
            "high": 4.14,
            "low": 3.91,
            "close": 3.95,
            "adjclose": 3.85
        },
        "1317216600": {
            "date": "28-09-2011",
            "open": 3.74,
            "high": 4.01,
            "low": 3.72,
            "close": 3.74,
            "adjclose": 3.64
        },
        "1317303000": {
            "date": "29-09-2011",
            "open": 3.75,
            "high": 3.97,
            "low": 3.71,
            "close": 3.75,
            "adjclose": 3.65
        },
        "1317389400": {
            "date": "30-09-2011",
            "open": 3.71,
            "high": 3.75,
            "low": 3.45,
            "close": 3.49,
            "adjclose": 3.4
        },
        "1317648600": {
            "date": "03-10-2011",
            "open": 3.51,
            "high": 3.56,
            "low": 2.85,
            "close": 2.92,
            "adjclose": 2.84
        },
        "1317735000": {
            "date": "04-10-2011",
            "open": 2.94,
            "high": 3.19,
            "low": 2.57,
            "close": 3.18,
            "adjclose": 3.1
        },
        "1317821400": {
            "date": "05-10-2011",
            "open": 3.17,
            "high": 3.35,
            "low": 3.06,
            "close": 3.16,
            "adjclose": 3.08
        },
        "1317907800": {
            "date": "06-10-2011",
            "open": 3.22,
            "high": 3.26,
            "low": 3.08,
            "close": 3.14,
            "adjclose": 3.06
        },
        "1317994200": {
            "date": "07-10-2011",
            "open": 3.19,
            "high": 3.22,
            "low": 2.99,
            "close": 3.03,
            "adjclose": 2.96
        },
        "1318253400": {
            "date": "10-10-2011",
            "open": 3.08,
            "high": 3.22,
            "low": 3.07,
            "close": 3.11,
            "adjclose": 3.03
        },
        "1318339800": {
            "date": "11-10-2011",
            "open": 3.11,
            "high": 3.15,
            "low": 3.04,
            "close": 3.07,
            "adjclose": 3
        },
        "1318426200": {
            "date": "12-10-2011",
            "open": 3.12,
            "high": 3.84,
            "low": 3.12,
            "close": 3.6,
            "adjclose": 3.51
        },
        "1318512600": {
            "date": "13-10-2011",
            "open": 3.59,
            "high": 4.09,
            "low": 3.38,
            "close": 3.91,
            "adjclose": 3.81
        },
        "1318599000": {
            "date": "14-10-2011",
            "open": 3.99,
            "high": 4.23,
            "low": 3.94,
            "close": 3.96,
            "adjclose": 3.86
        },
        "1318858200": {
            "date": "17-10-2011",
            "open": 3.98,
            "high": 3.98,
            "low": 3.52,
            "close": 3.54,
            "adjclose": 3.45
        },
        "1318944600": {
            "date": "18-10-2011",
            "open": 3.54,
            "high": 3.84,
            "low": 3.53,
            "close": 3.83,
            "adjclose": 3.73
        },
        "1319031000": {
            "date": "19-10-2011",
            "open": 3.86,
            "high": 4.05,
            "low": 3.76,
            "close": 3.81,
            "adjclose": 3.71
        },
        "1319117400": {
            "date": "20-10-2011",
            "open": 3.9,
            "high": 3.92,
            "low": 3.71,
            "close": 3.8,
            "adjclose": 3.71
        },
        "1319203800": {
            "date": "21-10-2011",
            "open": 3.91,
            "high": 3.98,
            "low": 3.82,
            "close": 3.82,
            "adjclose": 3.72
        },
        "1319463000": {
            "date": "24-10-2011",
            "open": 3.86,
            "high": 4.12,
            "low": 3.8,
            "close": 4.05,
            "adjclose": 3.94
        },
        "1319549400": {
            "date": "25-10-2011",
            "open": 4.01,
            "high": 4.01,
            "low": 3.86,
            "close": 3.88,
            "adjclose": 3.78
        },
        "1319635800": {
            "date": "26-10-2011",
            "open": 3.98,
            "high": 4.05,
            "low": 3.89,
            "close": 3.97,
            "adjclose": 3.87
        },
        "1319722200": {
            "date": "27-10-2011",
            "open": 4.11,
            "high": 4.74,
            "low": 4.11,
            "close": 4.62,
            "adjclose": 4.51
        },
        "1319808600": {
            "date": "28-10-2011",
            "open": 4.62,
            "high": 4.78,
            "low": 4.51,
            "close": 4.55,
            "adjclose": 4.44
        },
        "1320071400": {
            "date": "31-10-2011",
            "open": 4.51,
            "high": 4.63,
            "low": 4.47,
            "close": 4.61,
            "adjclose": 4.49
        },
        "1320157800": {
            "date": "01-11-2011",
            "open": 4.5,
            "high": 4.5,
            "low": 4.27,
            "close": 4.38,
            "adjclose": 4.27
        },
        "1320330600": {
            "date": "03-11-2011",
            "open": 4.45,
            "high": 4.74,
            "low": 4.45,
            "close": 4.74,
            "adjclose": 4.62
        },
        "1320417000": {
            "date": "04-11-2011",
            "open": 4.72,
            "high": 5.1,
            "low": 4.66,
            "close": 4.98,
            "adjclose": 4.85
        },
        "1320676200": {
            "date": "07-11-2011",
            "open": 4.95,
            "high": 5.16,
            "low": 4.94,
            "close": 5.03,
            "adjclose": 4.9
        },
        "1320762600": {
            "date": "08-11-2011",
            "open": 5.12,
            "high": 5.18,
            "low": 5.02,
            "close": 5.07,
            "adjclose": 4.95
        },
        "1320849000": {
            "date": "09-11-2011",
            "open": 4.94,
            "high": 4.99,
            "low": 4.63,
            "close": 4.65,
            "adjclose": 4.54
        },
        "1320935400": {
            "date": "10-11-2011",
            "open": 4.81,
            "high": 4.84,
            "low": 4.65,
            "close": 4.66,
            "adjclose": 4.55
        },
        "1321021800": {
            "date": "11-11-2011",
            "open": 4.75,
            "high": 4.98,
            "low": 4.74,
            "close": 4.95,
            "adjclose": 4.82
        },
        "1321281000": {
            "date": "14-11-2011",
            "open": 4.92,
            "high": 4.93,
            "low": 4.8,
            "close": 4.82,
            "adjclose": 4.7
        },
        "1321367400": {
            "date": "15-11-2011",
            "open": 4.8,
            "high": 4.99,
            "low": 4.74,
            "close": 4.98,
            "adjclose": 4.85
        },
        "1321453800": {
            "date": "16-11-2011",
            "open": 4.9,
            "high": 5,
            "low": 4.82,
            "close": 4.84,
            "adjclose": 4.71
        },
        "1321540200": {
            "date": "17-11-2011",
            "open": 4.87,
            "high": 4.93,
            "low": 4.67,
            "close": 4.71,
            "adjclose": 4.59
        },
        "1321626600": {
            "date": "18-11-2011",
            "open": 4.82,
            "high": 4.82,
            "low": 4.62,
            "close": 4.63,
            "adjclose": 4.51
        },
        "1321972200": {
            "date": "22-11-2011",
            "open": 4.56,
            "high": 4.62,
            "low": 4.43,
            "close": 4.56,
            "adjclose": 4.44
        },
        "1322058600": {
            "date": "23-11-2011",
            "open": 4.54,
            "high": 4.54,
            "low": 4.19,
            "close": 4.21,
            "adjclose": 4.11
        },
        "1322145000": {
            "date": "24-11-2011",
            "open": 4.25,
            "high": 4.33,
            "low": 4.2,
            "close": 4.21,
            "adjclose": 4.11
        },
        "1322231400": {
            "date": "25-11-2011",
            "open": 4.27,
            "high": 4.29,
            "low": 3.87,
            "close": 4.11,
            "adjclose": 4.01
        },
        "1322490600": {
            "date": "28-11-2011",
            "open": 4.18,
            "high": 4.69,
            "low": 4.18,
            "close": 4.56,
            "adjclose": 4.44
        },
        "1322577000": {
            "date": "29-11-2011",
            "open": 4.62,
            "high": 4.96,
            "low": 4.48,
            "close": 4.69,
            "adjclose": 4.57
        },
        "1322663400": {
            "date": "30-11-2011",
            "open": 4.9,
            "high": 5.12,
            "low": 4.82,
            "close": 5.02,
            "adjclose": 4.89
        },
        "1322749800": {
            "date": "01-12-2011",
            "open": 5.05,
            "high": 5.1,
            "low": 4.9,
            "close": 5.01,
            "adjclose": 4.88
        },
        "1322836200": {
            "date": "02-12-2011",
            "open": 5.1,
            "high": 5.18,
            "low": 5.08,
            "close": 5.12,
            "adjclose": 4.99
        },
        "1323095400": {
            "date": "05-12-2011",
            "open": 5.16,
            "high": 5.41,
            "low": 5.16,
            "close": 5.4,
            "adjclose": 5.26
        },
        "1323181800": {
            "date": "06-12-2011",
            "open": 5.32,
            "high": 5.41,
            "low": 5.22,
            "close": 5.33,
            "adjclose": 5.2
        },
        "1323268200": {
            "date": "07-12-2011",
            "open": 5.37,
            "high": 5.44,
            "low": 5.25,
            "close": 5.42,
            "adjclose": 5.28
        },
        "1323354600": {
            "date": "08-12-2011",
            "open": 5.33,
            "high": 5.37,
            "low": 4.91,
            "close": 5.17,
            "adjclose": 5.04
        },
        "1323441000": {
            "date": "09-12-2011",
            "open": 5.22,
            "high": 5.52,
            "low": 5.22,
            "close": 5.45,
            "adjclose": 5.32
        },
        "1323786600": {
            "date": "13-12-2011",
            "open": 5.33,
            "high": 5.42,
            "low": 5.14,
            "close": 5.19,
            "adjclose": 5.06
        },
        "1323873000": {
            "date": "14-12-2011",
            "open": 5.14,
            "high": 5.26,
            "low": 5.06,
            "close": 5.1,
            "adjclose": 4.97
        },
        "1323959400": {
            "date": "15-12-2011",
            "open": 5.22,
            "high": 5.26,
            "low": 5.13,
            "close": 5.16,
            "adjclose": 5.03
        },
        "1324045800": {
            "date": "16-12-2011",
            "open": 5.22,
            "high": 5.45,
            "low": 5.19,
            "close": 5.45,
            "adjclose": 5.32
        },
        "1324305000": {
            "date": "19-12-2011",
            "open": 5.4,
            "high": 5.46,
            "low": 5.18,
            "close": 5.19,
            "adjclose": 5.06
        },
        "1324391400": {
            "date": "20-12-2011",
            "open": 5.33,
            "high": 5.55,
            "low": 5.33,
            "close": 5.55,
            "adjclose": 5.41
        },
        "1324477800": {
            "date": "21-12-2011",
            "open": 5.53,
            "high": 5.57,
            "low": 5.42,
            "close": 5.53,
            "adjclose": 5.39
        },
        "1324564200": {
            "date": "22-12-2011",
            "open": 5.56,
            "high": 5.96,
            "low": 5.54,
            "close": 5.94,
            "adjclose": 5.79
        },
        "1324650600": {
            "date": "23-12-2011",
            "open": 5.94,
            "high": 6.09,
            "low": 5.86,
            "close": 5.93,
            "adjclose": 5.78
        },
        "1324909800": {
            "date": "26-12-2011",
            "open": 5.95,
            "high": 6.01,
            "low": 5.88,
            "close": 6,
            "adjclose": 5.85
        },
        "1324996200": {
            "date": "27-12-2011",
            "open": 6.01,
            "high": 6.04,
            "low": 5.86,
            "close": 5.89,
            "adjclose": 5.74
        },
        "1325082600": {
            "date": "28-12-2011",
            "open": 5.88,
            "high": 5.93,
            "low": 5.75,
            "close": 5.78,
            "adjclose": 5.63
        },
        "1325169000": {
            "date": "29-12-2011",
            "open": 5.79,
            "high": 5.97,
            "low": 5.79,
            "close": 5.95,
            "adjclose": 5.8
        },
        "1325255400": {
            "date": "30-12-2011",
            "open": 5.94,
            "high": 6.01,
            "low": 5.79,
            "close": 5.85,
            "adjclose": 5.7
        },
        "1325514600": {
            "date": "02-01-2012",
            "open": 5.89,
            "high": 5.96,
            "low": 5.88,
            "close": 5.95,
            "adjclose": 5.8
        },
        "1325601000": {
            "date": "03-01-2012",
            "open": 6.01,
            "high": 6.1,
            "low": 6.01,
            "close": 6.01,
            "adjclose": 5.86
        },
        "1325687400": {
            "date": "04-01-2012",
            "open": 5.99,
            "high": 6.17,
            "low": 5.97,
            "close": 6.12,
            "adjclose": 5.97
        },
        "1325773800": {
            "date": "05-01-2012",
            "open": 6.1,
            "high": 6.11,
            "low": 5.97,
            "close": 6.01,
            "adjclose": 5.86
        },
        "1326119400": {
            "date": "09-01-2012",
            "open": 5.94,
            "high": 5.94,
            "low": 5.73,
            "close": 5.77,
            "adjclose": 5.62
        },
        "1326205800": {
            "date": "10-01-2012",
            "open": 5.91,
            "high": 5.93,
            "low": 5.8,
            "close": 5.81,
            "adjclose": 5.66
        },
        "1326292200": {
            "date": "11-01-2012",
            "open": 5.83,
            "high": 6.08,
            "low": 5.79,
            "close": 6.01,
            "adjclose": 5.85
        },
        "1326378600": {
            "date": "12-01-2012",
            "open": 6.09,
            "high": 6.24,
            "low": 6.01,
            "close": 6.12,
            "adjclose": 5.97
        },
        "1326465000": {
            "date": "13-01-2012",
            "open": 6.07,
            "high": 6.12,
            "low": 5.93,
            "close": 6.06,
            "adjclose": 5.91
        },
        "1326724200": {
            "date": "16-01-2012",
            "open": 6.09,
            "high": 6.09,
            "low": 6.01,
            "close": 6.07,
            "adjclose": 5.92
        },
        "1326810600": {
            "date": "17-01-2012",
            "open": 6.13,
            "high": 6.24,
            "low": 6.02,
            "close": 6.08,
            "adjclose": 5.92
        },
        "1326897000": {
            "date": "18-01-2012",
            "open": 6.05,
            "high": 6.5,
            "low": 6.05,
            "close": 6.49,
            "adjclose": 6.32
        },
        "1326983400": {
            "date": "19-01-2012",
            "open": 6.53,
            "high": 6.84,
            "low": 6.53,
            "close": 6.72,
            "adjclose": 6.55
        },
        "1327069800": {
            "date": "20-01-2012",
            "open": 6.72,
            "high": 6.74,
            "low": 6.5,
            "close": 6.7,
            "adjclose": 6.53
        },
        "1327329000": {
            "date": "23-01-2012",
            "open": 6.74,
            "high": 6.77,
            "low": 6.52,
            "close": 6.64,
            "adjclose": 6.47
        },
        "1327415400": {
            "date": "24-01-2012",
            "open": 6.62,
            "high": 6.68,
            "low": 6.49,
            "close": 6.62,
            "adjclose": 6.46
        },
        "1327501800": {
            "date": "25-01-2012",
            "open": 6.61,
            "high": 6.8,
            "low": 6.58,
            "close": 6.77,
            "adjclose": 6.6
        },
        "1327588200": {
            "date": "26-01-2012",
            "open": 6.88,
            "high": 7.03,
            "low": 6.86,
            "close": 6.95,
            "adjclose": 6.77
        },
        "1327674600": {
            "date": "27-01-2012",
            "open": 6.95,
            "high": 6.95,
            "low": 6.8,
            "close": 6.84,
            "adjclose": 6.66
        },
        "1327933800": {
            "date": "30-01-2012",
            "open": 6.76,
            "high": 7.36,
            "low": 6.65,
            "close": 6.9,
            "adjclose": 6.73
        },
        "1328020200": {
            "date": "31-01-2012",
            "open": 6.99,
            "high": 7.11,
            "low": 6.87,
            "close": 6.98,
            "adjclose": 6.8
        },
        "1328106600": {
            "date": "01-02-2012",
            "open": 7.07,
            "high": 7.21,
            "low": 6.98,
            "close": 7.21,
            "adjclose": 7.03
        },
        "1328193000": {
            "date": "02-02-2012",
            "open": 7.33,
            "high": 7.92,
            "low": 7.24,
            "close": 7.9,
            "adjclose": 7.7
        },
        "1328279400": {
            "date": "03-02-2012",
            "open": 8.14,
            "high": 8.31,
            "low": 8.01,
            "close": 8.2,
            "adjclose": 7.99
        },
        "1328625000": {
            "date": "07-02-2012",
            "open": 8.16,
            "high": 8.36,
            "low": 8.03,
            "close": 8.25,
            "adjclose": 8.04
        },
        "1328711400": {
            "date": "08-02-2012",
            "open": 8.27,
            "high": 8.51,
            "low": 8.27,
            "close": 8.47,
            "adjclose": 8.26
        },
        "1328797800": {
            "date": "09-02-2012",
            "open": 8.5,
            "high": 8.61,
            "low": 8.5,
            "close": 8.57,
            "adjclose": 8.35
        },
        "1328884200": {
            "date": "10-02-2012",
            "open": 8.46,
            "high": 8.57,
            "low": 8.36,
            "close": 8.52,
            "adjclose": 8.3
        },
        "1329143400": {
            "date": "13-02-2012",
            "open": 8.65,
            "high": 8.65,
            "low": 8.5,
            "close": 8.57,
            "adjclose": 8.35
        },
        "1329229800": {
            "date": "14-02-2012",
            "open": 8.54,
            "high": 8.57,
            "low": 8.21,
            "close": 8.35,
            "adjclose": 8.14
        },
        "1329316200": {
            "date": "15-02-2012",
            "open": 8.38,
            "high": 8.54,
            "low": 8.27,
            "close": 8.33,
            "adjclose": 8.12
        },
        "1329402600": {
            "date": "16-02-2012",
            "open": 8.39,
            "high": 8.57,
            "low": 8.3,
            "close": 8.5,
            "adjclose": 8.29
        },
        "1329489000": {
            "date": "17-02-2012",
            "open": 8.54,
            "high": 8.73,
            "low": 8.52,
            "close": 8.54,
            "adjclose": 8.33
        },
        "1329748200": {
            "date": "20-02-2012",
            "open": 8.57,
            "high": 8.65,
            "low": 8.57,
            "close": 8.61,
            "adjclose": 8.4
        },
        "1329834600": {
            "date": "21-02-2012",
            "open": 8.61,
            "high": 8.64,
            "low": 8.24,
            "close": 8.31,
            "adjclose": 8.1
        },
        "1329921000": {
            "date": "22-02-2012",
            "open": 8.33,
            "high": 8.35,
            "low": 8.02,
            "close": 8.16,
            "adjclose": 7.96
        },
        "1330007400": {
            "date": "23-02-2012",
            "open": 8.12,
            "high": 8.22,
            "low": 7.98,
            "close": 7.98,
            "adjclose": 7.78
        },
        "1330093800": {
            "date": "24-02-2012",
            "open": 7.97,
            "high": 7.98,
            "low": 7.41,
            "close": 7.47,
            "adjclose": 7.28
        },
        "1330353000": {
            "date": "27-02-2012",
            "open": 7.38,
            "high": 7.98,
            "low": 7.38,
            "close": 7.85,
            "adjclose": 7.65
        },
        "1330439400": {
            "date": "28-02-2012",
            "open": 7.89,
            "high": 7.89,
            "low": 7.62,
            "close": 7.78,
            "adjclose": 7.59
        },
        "1330525800": {
            "date": "29-02-2012",
            "open": 7.81,
            "high": 7.92,
            "low": 7.71,
            "close": 7.78,
            "adjclose": 7.58
        },
        "1330612200": {
            "date": "01-03-2012",
            "open": 7.8,
            "high": 7.93,
            "low": 7.59,
            "close": 7.82,
            "adjclose": 7.63
        },
        "1330698600": {
            "date": "02-03-2012",
            "open": 7.82,
            "high": 8.13,
            "low": 7.75,
            "close": 8.12,
            "adjclose": 7.92
        },
        "1330957800": {
            "date": "05-03-2012",
            "open": 8.11,
            "high": 8.12,
            "low": 7.96,
            "close": 8.08,
            "adjclose": 7.87
        },
        "1331044200": {
            "date": "06-03-2012",
            "open": 7.98,
            "high": 7.98,
            "low": 7.67,
            "close": 7.74,
            "adjclose": 7.54
        },
        "1331130600": {
            "date": "07-03-2012",
            "open": 7.76,
            "high": 7.86,
            "low": 7.72,
            "close": 7.75,
            "adjclose": 7.56
        },
        "1331217000": {
            "date": "08-03-2012",
            "open": 7.86,
            "high": 8.04,
            "low": 7.78,
            "close": 8.01,
            "adjclose": 7.81
        },
        "1331303400": {
            "date": "09-03-2012",
            "open": 8.06,
            "high": 8.16,
            "low": 7.97,
            "close": 8.03,
            "adjclose": 7.83
        },
        "1331562600": {
            "date": "12-03-2012",
            "open": 8.02,
            "high": 8.08,
            "low": 7.79,
            "close": 7.8,
            "adjclose": 7.6
        },
        "1331649000": {
            "date": "13-03-2012",
            "open": 7.86,
            "high": 8,
            "low": 7.76,
            "close": 7.97,
            "adjclose": 7.77
        },
        "1331735400": {
            "date": "14-03-2012",
            "open": 7.94,
            "high": 8.01,
            "low": 7.86,
            "close": 7.96,
            "adjclose": 7.76
        },
        "1331821800": {
            "date": "15-03-2012",
            "open": 7.98,
            "high": 8.06,
            "low": 7.82,
            "close": 7.87,
            "adjclose": 7.67
        },
        "1331908200": {
            "date": "16-03-2012",
            "open": 7.9,
            "high": 7.9,
            "low": 7.51,
            "close": 7.56,
            "adjclose": 7.36
        },
        "1332253800": {
            "date": "20-03-2012",
            "open": 7.59,
            "high": 7.86,
            "low": 7.45,
            "close": 7.85,
            "adjclose": 7.65
        },
        "1332340200": {
            "date": "21-03-2012",
            "open": 7.9,
            "high": 8.19,
            "low": 7.89,
            "close": 8.16,
            "adjclose": 7.96
        },
        "1332426600": {
            "date": "22-03-2012",
            "open": 8.12,
            "high": 8.16,
            "low": 7.95,
            "close": 7.99,
            "adjclose": 7.79
        },
        "1332513000": {
            "date": "23-03-2012",
            "open": 7.99,
            "high": 8.06,
            "low": 7.84,
            "close": 8.01,
            "adjclose": 7.81
        },
        "1332772200": {
            "date": "26-03-2012",
            "open": 8.1,
            "high": 8.14,
            "low": 7.9,
            "close": 8.07,
            "adjclose": 7.87
        },
        "1332858600": {
            "date": "27-03-2012",
            "open": 8.2,
            "high": 8.34,
            "low": 8.08,
            "close": 8.16,
            "adjclose": 7.96
        },
        "1332945000": {
            "date": "28-03-2012",
            "open": 8.2,
            "high": 8.26,
            "low": 8.05,
            "close": 8.06,
            "adjclose": 7.86
        },
        "1333031400": {
            "date": "29-03-2012",
            "open": 8.05,
            "high": 8.19,
            "low": 7.8,
            "close": 8.17,
            "adjclose": 7.96
        },
        "1333117800": {
            "date": "30-03-2012",
            "open": 8.17,
            "high": 8.37,
            "low": 8.06,
            "close": 8.14,
            "adjclose": 7.93
        },
        "1333373400": {
            "date": "02-04-2012",
            "open": 8.15,
            "high": 8.21,
            "low": 8.06,
            "close": 8.15,
            "adjclose": 7.94
        },
        "1333459800": {
            "date": "03-04-2012",
            "open": 8.11,
            "high": 8.16,
            "low": 7.94,
            "close": 8,
            "adjclose": 7.8
        },
        "1333546200": {
            "date": "04-04-2012",
            "open": 7.92,
            "high": 7.93,
            "low": 7.73,
            "close": 7.82,
            "adjclose": 7.63
        },
        "1333978200": {
            "date": "09-04-2012",
            "open": 7.52,
            "high": 7.8,
            "low": 7.52,
            "close": 7.69,
            "adjclose": 7.49
        },
        "1334064600": {
            "date": "10-04-2012",
            "open": 7.7,
            "high": 7.76,
            "low": 7.37,
            "close": 7.39,
            "adjclose": 7.2
        },
        "1334151000": {
            "date": "11-04-2012",
            "open": 7.56,
            "high": 7.6,
            "low": 7.44,
            "close": 7.45,
            "adjclose": 7.27
        },
        "1334237400": {
            "date": "12-04-2012",
            "open": 7.52,
            "high": 7.75,
            "low": 7.5,
            "close": 7.59,
            "adjclose": 7.4
        },
        "1334323800": {
            "date": "13-04-2012",
            "open": 7.59,
            "high": 7.59,
            "low": 7.34,
            "close": 7.38,
            "adjclose": 7.19
        },
        "1334583000": {
            "date": "16-04-2012",
            "open": 7.41,
            "high": 7.55,
            "low": 7.21,
            "close": 7.23,
            "adjclose": 7.05
        },
        "1334669400": {
            "date": "17-04-2012",
            "open": 7.32,
            "high": 7.55,
            "low": 7.32,
            "close": 7.47,
            "adjclose": 7.28
        },
        "1334755800": {
            "date": "18-04-2012",
            "open": 7.46,
            "high": 7.49,
            "low": 7.36,
            "close": 7.4,
            "adjclose": 7.21
        },
        "1334842200": {
            "date": "19-04-2012",
            "open": 7.41,
            "high": 7.5,
            "low": 7.15,
            "close": 7.27,
            "adjclose": 7.08
        },
        "1334928600": {
            "date": "20-04-2012",
            "open": 7.36,
            "high": 7.41,
            "low": 7.28,
            "close": 7.32,
            "adjclose": 7.14
        },
        "1335187800": {
            "date": "23-04-2012",
            "open": 7.22,
            "high": 7.28,
            "low": 7.16,
            "close": 7.25,
            "adjclose": 7.07
        },
        "1335274200": {
            "date": "24-04-2012",
            "open": 7.27,
            "high": 7.37,
            "low": 7.23,
            "close": 7.36,
            "adjclose": 7.17
        },
        "1335360600": {
            "date": "25-04-2012",
            "open": 7.37,
            "high": 7.8,
            "low": 7.37,
            "close": 7.78,
            "adjclose": 7.58
        },
        "1335447000": {
            "date": "26-04-2012",
            "open": 7.78,
            "high": 7.98,
            "low": 7.6,
            "close": 7.76,
            "adjclose": 7.56
        },
        "1335533400": {
            "date": "27-04-2012",
            "open": 7.8,
            "high": 7.82,
            "low": 7.64,
            "close": 7.7,
            "adjclose": 7.51
        },
        "1335792600": {
            "date": "30-04-2012",
            "open": 7.77,
            "high": 7.8,
            "low": 7.59,
            "close": 7.74,
            "adjclose": 7.55
        },
        "1335965400": {
            "date": "02-05-2012",
            "open": 7.73,
            "high": 7.73,
            "low": 7.51,
            "close": 7.51,
            "adjclose": 7.32
        },
        "1336051800": {
            "date": "03-05-2012",
            "open": 7.56,
            "high": 7.63,
            "low": 7.27,
            "close": 7.33,
            "adjclose": 7.15
        },
        "1336138200": {
            "date": "04-05-2012",
            "open": 7.3,
            "high": 7.33,
            "low": 7.2,
            "close": 7.25,
            "adjclose": 7.07
        },
        "1336397400": {
            "date": "07-05-2012",
            "open": 7.24,
            "high": 7.48,
            "low": 7.15,
            "close": 7.48,
            "adjclose": 7.29
        },
        "1336483800": {
            "date": "08-05-2012",
            "open": 7.43,
            "high": 7.49,
            "low": 7.26,
            "close": 7.46,
            "adjclose": 7.27
        },
        "1336570200": {
            "date": "09-05-2012",
            "open": 7.32,
            "high": 7.52,
            "low": 7.32,
            "close": 7.4,
            "adjclose": 7.21
        },
        "1336656600": {
            "date": "10-05-2012",
            "open": 7.45,
            "high": 7.56,
            "low": 7.38,
            "close": 7.49,
            "adjclose": 7.3
        },
        "1336743000": {
            "date": "11-05-2012",
            "open": 7.36,
            "high": 7.5,
            "low": 7.27,
            "close": 7.27,
            "adjclose": 7.09
        },
        "1337002200": {
            "date": "14-05-2012",
            "open": 7.23,
            "high": 7.28,
            "low": 6.82,
            "close": 6.85,
            "adjclose": 6.67
        },
        "1337088600": {
            "date": "15-05-2012",
            "open": 6.86,
            "high": 6.97,
            "low": 6.47,
            "close": 6.49,
            "adjclose": 6.33
        },
        "1337175000": {
            "date": "16-05-2012",
            "open": 6.6,
            "high": 6.62,
            "low": 6.24,
            "close": 6.26,
            "adjclose": 6.1
        },
        "1337261400": {
            "date": "17-05-2012",
            "open": 6.28,
            "high": 6.44,
            "low": 6.12,
            "close": 6.25,
            "adjclose": 6.1
        },
        "1337347800": {
            "date": "18-05-2012",
            "open": 6.4,
            "high": 6.4,
            "low": 5.85,
            "close": 5.88,
            "adjclose": 5.73
        },
        "1337607000": {
            "date": "21-05-2012",
            "open": 5.96,
            "high": 6.35,
            "low": 5.9,
            "close": 6.3,
            "adjclose": 6.14
        },
        "1337693400": {
            "date": "22-05-2012",
            "open": 6.33,
            "high": 6.62,
            "low": 6.25,
            "close": 6.32,
            "adjclose": 6.16
        },
        "1337779800": {
            "date": "23-05-2012",
            "open": 6.14,
            "high": 6.37,
            "low": 6.02,
            "close": 6.34,
            "adjclose": 6.18
        },
        "1337866200": {
            "date": "24-05-2012",
            "open": 6.44,
            "high": 6.46,
            "low": 6.25,
            "close": 6.27,
            "adjclose": 6.11
        },
        "1337952600": {
            "date": "25-05-2012",
            "open": 6.3,
            "high": 6.4,
            "low": 6.19,
            "close": 6.31,
            "adjclose": 6.15
        },
        "1338211800": {
            "date": "28-05-2012",
            "open": 6.37,
            "high": 6.44,
            "low": 6.36,
            "close": 6.39,
            "adjclose": 6.23
        },
        "1338298200": {
            "date": "29-05-2012",
            "open": 6.56,
            "high": 6.73,
            "low": 6.39,
            "close": 6.69,
            "adjclose": 6.52
        },
        "1338384600": {
            "date": "30-05-2012",
            "open": 6.58,
            "high": 6.62,
            "low": 6.31,
            "close": 6.42,
            "adjclose": 6.26
        },
        "1338471000": {
            "date": "31-05-2012",
            "open": 6.45,
            "high": 6.62,
            "low": 6.3,
            "close": 6.62,
            "adjclose": 6.45
        },
        "1338557400": {
            "date": "01-06-2012",
            "open": 6.35,
            "high": 6.4,
            "low": 6,
            "close": 6.03,
            "adjclose": 5.88
        },
        "1338816600": {
            "date": "04-06-2012",
            "open": 6.09,
            "high": 6.12,
            "low": 5.88,
            "close": 5.97,
            "adjclose": 5.82
        },
        "1338903000": {
            "date": "05-06-2012",
            "open": 6,
            "high": 6.16,
            "low": 5.99,
            "close": 6,
            "adjclose": 5.85
        },
        "1338989400": {
            "date": "06-06-2012",
            "open": 6.05,
            "high": 6.3,
            "low": 6.05,
            "close": 6.23,
            "adjclose": 6.07
        },
        "1339075800": {
            "date": "07-06-2012",
            "open": 6.29,
            "high": 6.49,
            "low": 6.14,
            "close": 6.16,
            "adjclose": 6.01
        },
        "1339162200": {
            "date": "08-06-2012",
            "open": 6.16,
            "high": 6.24,
            "low": 6.03,
            "close": 6.21,
            "adjclose": 6.05
        },
        "1339421400": {
            "date": "11-06-2012",
            "open": 6.34,
            "high": 6.42,
            "low": 6.03,
            "close": 6.03,
            "adjclose": 5.88
        },
        "1339507800": {
            "date": "12-06-2012",
            "open": 6.19,
            "high": 6.19,
            "low": 6.03,
            "close": 6.11,
            "adjclose": 5.95
        },
        "1339594200": {
            "date": "13-06-2012",
            "open": 6.07,
            "high": 6.13,
            "low": 5.76,
            "close": 5.87,
            "adjclose": 5.72
        },
        "1339680600": {
            "date": "14-06-2012",
            "open": 5.86,
            "high": 6.11,
            "low": 5.75,
            "close": 6.07,
            "adjclose": 5.91
        },
        "1339767000": {
            "date": "15-06-2012",
            "open": 6.05,
            "high": 6.3,
            "low": 6.05,
            "close": 6.27,
            "adjclose": 6.11
        },
        "1340026200": {
            "date": "18-06-2012",
            "open": 6.3,
            "high": 6.36,
            "low": 6.18,
            "close": 6.3,
            "adjclose": 6.15
        },
        "1340112600": {
            "date": "19-06-2012",
            "open": 6.3,
            "high": 6.61,
            "low": 6.3,
            "close": 6.55,
            "adjclose": 6.39
        },
        "1340199000": {
            "date": "20-06-2012",
            "open": 6.58,
            "high": 6.65,
            "low": 6.5,
            "close": 6.57,
            "adjclose": 6.4
        },
        "1340285400": {
            "date": "21-06-2012",
            "open": 6.56,
            "high": 6.65,
            "low": 6.33,
            "close": 6.35,
            "adjclose": 6.19
        },
        "1340371800": {
            "date": "22-06-2012",
            "open": 6.4,
            "high": 6.57,
            "low": 6.36,
            "close": 6.49,
            "adjclose": 6.33
        },
        "1340631000": {
            "date": "25-06-2012",
            "open": 6.45,
            "high": 7.06,
            "low": 6.44,
            "close": 7,
            "adjclose": 6.83
        },
        "1340717400": {
            "date": "26-06-2012",
            "open": 7.03,
            "high": 7.16,
            "low": 6.89,
            "close": 7.04,
            "adjclose": 6.87
        },
        "1340803800": {
            "date": "27-06-2012",
            "open": 7.03,
            "high": 7.19,
            "low": 6.9,
            "close": 7.04,
            "adjclose": 6.86
        },
        "1340890200": {
            "date": "28-06-2012",
            "open": 6.99,
            "high": 7.23,
            "low": 6.95,
            "close": 7.2,
            "adjclose": 7.02
        },
        "1340976600": {
            "date": "29-06-2012",
            "open": 7.36,
            "high": 7.55,
            "low": 7.22,
            "close": 7.38,
            "adjclose": 7.19
        },
        "1341322200": {
            "date": "03-07-2012",
            "open": 7.37,
            "high": 7.47,
            "low": 7.33,
            "close": 7.36,
            "adjclose": 7.17
        },
        "1341408600": {
            "date": "04-07-2012",
            "open": 7.31,
            "high": 7.31,
            "low": 7.21,
            "close": 7.23,
            "adjclose": 7.05
        },
        "1341495000": {
            "date": "05-07-2012",
            "open": 7.23,
            "high": 7.32,
            "low": 7.17,
            "close": 7.19,
            "adjclose": 7.01
        },
        "1341581400": {
            "date": "06-07-2012",
            "open": 7.19,
            "high": 7.25,
            "low": 7.13,
            "close": 7.22,
            "adjclose": 7.03
        },
        "1341840600": {
            "date": "09-07-2012",
            "open": 7.16,
            "high": 7.2,
            "low": 6.95,
            "close": 6.97,
            "adjclose": 6.79
        },
        "1341927000": {
            "date": "10-07-2012",
            "open": 7.07,
            "high": 7.18,
            "low": 6.99,
            "close": 7.07,
            "adjclose": 6.89
        },
        "1342013400": {
            "date": "11-07-2012",
            "open": 7.08,
            "high": 7.19,
            "low": 7.02,
            "close": 7.14,
            "adjclose": 6.96
        },
        "1342099800": {
            "date": "12-07-2012",
            "open": 7.15,
            "high": 7.27,
            "low": 6.99,
            "close": 7.18,
            "adjclose": 7
        },
        "1342186200": {
            "date": "13-07-2012",
            "open": 7.26,
            "high": 7.42,
            "low": 7.24,
            "close": 7.39,
            "adjclose": 7.2
        },
        "1342445400": {
            "date": "16-07-2012",
            "open": 7.42,
            "high": 7.43,
            "low": 7.3,
            "close": 7.35,
            "adjclose": 7.16
        },
        "1342531800": {
            "date": "17-07-2012",
            "open": 7.4,
            "high": 7.43,
            "low": 7.28,
            "close": 7.35,
            "adjclose": 7.16
        },
        "1342618200": {
            "date": "18-07-2012",
            "open": 7.41,
            "high": 7.41,
            "low": 7.1,
            "close": 7.11,
            "adjclose": 6.93
        },
        "1342704600": {
            "date": "19-07-2012",
            "open": 7.19,
            "high": 7.38,
            "low": 7.15,
            "close": 7.35,
            "adjclose": 7.16
        },
        "1342791000": {
            "date": "20-07-2012",
            "open": 7.36,
            "high": 7.87,
            "low": 7.32,
            "close": 7.78,
            "adjclose": 7.59
        },
        "1343050200": {
            "date": "23-07-2012",
            "open": 7.67,
            "high": 7.71,
            "low": 7.5,
            "close": 7.58,
            "adjclose": 7.39
        },
        "1343136600": {
            "date": "24-07-2012",
            "open": 7.58,
            "high": 7.65,
            "low": 7.48,
            "close": 7.55,
            "adjclose": 7.36
        },
        "1343223000": {
            "date": "25-07-2012",
            "open": 7.56,
            "high": 7.64,
            "low": 7.48,
            "close": 7.49,
            "adjclose": 7.3
        },
        "1343309400": {
            "date": "26-07-2012",
            "open": 7.56,
            "high": 7.84,
            "low": 7.52,
            "close": 7.79,
            "adjclose": 7.6
        },
        "1343395800": {
            "date": "27-07-2012",
            "open": 7.81,
            "high": 8.12,
            "low": 7.74,
            "close": 8.1,
            "adjclose": 7.89
        },
        "1343655000": {
            "date": "30-07-2012",
            "open": 8.11,
            "high": 8.11,
            "low": 7.83,
            "close": 7.86,
            "adjclose": 7.66
        },
        "1343741400": {
            "date": "31-07-2012",
            "open": 7.86,
            "high": 7.95,
            "low": 7.59,
            "close": 7.63,
            "adjclose": 7.43
        },
        "1343827800": {
            "date": "01-08-2012",
            "open": 7.73,
            "high": 7.82,
            "low": 7.6,
            "close": 7.65,
            "adjclose": 7.46
        },
        "1343914200": {
            "date": "02-08-2012",
            "open": 7.6,
            "high": 7.8,
            "low": 7.5,
            "close": 7.75,
            "adjclose": 7.56
        },
        "1344000600": {
            "date": "03-08-2012",
            "open": 7.81,
            "high": 8,
            "low": 7.78,
            "close": 7.81,
            "adjclose": 7.61
        },
        "1344259800": {
            "date": "06-08-2012",
            "open": 7.85,
            "high": 8.01,
            "low": 7.81,
            "close": 7.98,
            "adjclose": 7.78
        },
        "1344346200": {
            "date": "07-08-2012",
            "open": 7.97,
            "high": 8.05,
            "low": 7.81,
            "close": 7.83,
            "adjclose": 7.64
        },
        "1344432600": {
            "date": "08-08-2012",
            "open": 7.83,
            "high": 7.96,
            "low": 7.73,
            "close": 7.83,
            "adjclose": 7.64
        },
        "1344519000": {
            "date": "09-08-2012",
            "open": 7.82,
            "high": 7.91,
            "low": 7.77,
            "close": 7.82,
            "adjclose": 7.62
        },
        "1344605400": {
            "date": "10-08-2012",
            "open": 7.77,
            "high": 8.09,
            "low": 7.77,
            "close": 8.05,
            "adjclose": 7.85
        },
        "1344864600": {
            "date": "13-08-2012",
            "open": 8.04,
            "high": 8.1,
            "low": 7.94,
            "close": 7.98,
            "adjclose": 7.78
        },
        "1344951000": {
            "date": "14-08-2012",
            "open": 7.99,
            "high": 8.08,
            "low": 7.95,
            "close": 8.05,
            "adjclose": 7.84
        },
        "1345037400": {
            "date": "15-08-2012",
            "open": 8.01,
            "high": 8.2,
            "low": 7.97,
            "close": 8.17,
            "adjclose": 7.96
        },
        "1345123800": {
            "date": "16-08-2012",
            "open": 8.19,
            "high": 8.59,
            "low": 8.15,
            "close": 8.36,
            "adjclose": 8.15
        },
        "1345210200": {
            "date": "17-08-2012",
            "open": 8.34,
            "high": 8.55,
            "low": 8.33,
            "close": 8.47,
            "adjclose": 8.25
        },
        "1345469400": {
            "date": "20-08-2012",
            "open": 8.47,
            "high": 8.47,
            "low": 8.27,
            "close": 8.29,
            "adjclose": 8.08
        },
        "1345555800": {
            "date": "21-08-2012",
            "open": 8.5,
            "high": 8.53,
            "low": 8.38,
            "close": 8.43,
            "adjclose": 8.22
        },
        "1345642200": {
            "date": "22-08-2012",
            "open": 8.71,
            "high": 9.03,
            "low": 8.63,
            "close": 8.79,
            "adjclose": 8.56
        },
        "1345728600": {
            "date": "23-08-2012",
            "open": 8.71,
            "high": 8.81,
            "low": 8.52,
            "close": 8.58,
            "adjclose": 8.36
        },
        "1345815000": {
            "date": "24-08-2012",
            "open": 8.66,
            "high": 8.81,
            "low": 8.56,
            "close": 8.75,
            "adjclose": 8.52
        },
        "1346074200": {
            "date": "27-08-2012",
            "open": 8.79,
            "high": 8.86,
            "low": 8.56,
            "close": 8.57,
            "adjclose": 8.36
        },
        "1346160600": {
            "date": "28-08-2012",
            "open": 8.58,
            "high": 8.63,
            "low": 8.46,
            "close": 8.52,
            "adjclose": 8.31
        },
        "1346247000": {
            "date": "29-08-2012",
            "open": 8.51,
            "high": 8.6,
            "low": 8.41,
            "close": 8.44,
            "adjclose": 8.23
        },
        "1346333400": {
            "date": "30-08-2012",
            "open": 8.47,
            "high": 8.47,
            "low": 8.31,
            "close": 8.33,
            "adjclose": 8.12
        },
        "1346419800": {
            "date": "31-08-2012",
            "open": 8.36,
            "high": 8.43,
            "low": 7.97,
            "close": 8.01,
            "adjclose": 7.81
        },
        "1346679000": {
            "date": "03-09-2012",
            "open": 8.17,
            "high": 8.22,
            "low": 8.05,
            "close": 8.15,
            "adjclose": 7.94
        },
        "1346765400": {
            "date": "04-09-2012",
            "open": 8.19,
            "high": 8.19,
            "low": 8.02,
            "close": 8.11,
            "adjclose": 7.91
        },
        "1346851800": {
            "date": "05-09-2012",
            "open": 8.15,
            "high": 8.28,
            "low": 8.06,
            "close": 8.22,
            "adjclose": 8.01
        },
        "1346938200": {
            "date": "06-09-2012",
            "open": 8.51,
            "high": 8.53,
            "low": 8.24,
            "close": 8.51,
            "adjclose": 8.29
        },
        "1347024600": {
            "date": "07-09-2012",
            "open": 8.51,
            "high": 8.64,
            "low": 8.46,
            "close": 8.61,
            "adjclose": 8.39
        },
        "1347283800": {
            "date": "10-09-2012",
            "open": 8.67,
            "high": 8.7,
            "low": 8.47,
            "close": 8.49,
            "adjclose": 8.28
        },
        "1347370200": {
            "date": "11-09-2012",
            "open": 8.59,
            "high": 8.65,
            "low": 8.46,
            "close": 8.6,
            "adjclose": 8.38
        },
        "1347456600": {
            "date": "12-09-2012",
            "open": 8.67,
            "high": 8.88,
            "low": 8.67,
            "close": 8.86,
            "adjclose": 8.64
        },
        "1347629400": {
            "date": "14-09-2012",
            "open": 8.88,
            "high": 9.14,
            "low": 8.64,
            "close": 8.71,
            "adjclose": 8.49
        },
        "1347888600": {
            "date": "17-09-2012",
            "open": 8.72,
            "high": 8.88,
            "low": 8.59,
            "close": 8.82,
            "adjclose": 8.6
        },
        "1347975000": {
            "date": "18-09-2012",
            "open": 8.84,
            "high": 8.92,
            "low": 8.76,
            "close": 8.81,
            "adjclose": 8.59
        },
        "1348061400": {
            "date": "19-09-2012",
            "open": 8.94,
            "high": 9.07,
            "low": 8.77,
            "close": 9.04,
            "adjclose": 8.81
        },
        "1348147800": {
            "date": "20-09-2012",
            "open": 9.02,
            "high": 9.04,
            "low": 8.94,
            "close": 9.01,
            "adjclose": 8.78
        },
        "1348234200": {
            "date": "21-09-2012",
            "open": 9.03,
            "high": 9.08,
            "low": 8.92,
            "close": 8.97,
            "adjclose": 8.74
        },
        "1348493400": {
            "date": "24-09-2012",
            "open": 8.83,
            "high": 8.94,
            "low": 8.79,
            "close": 8.87,
            "adjclose": 8.64
        },
        "1348579800": {
            "date": "25-09-2012",
            "open": 8.89,
            "high": 8.94,
            "low": 8.68,
            "close": 8.7,
            "adjclose": 8.48
        },
        "1348666200": {
            "date": "26-09-2012",
            "open": 8.52,
            "high": 8.79,
            "low": 8.32,
            "close": 8.42,
            "adjclose": 8.2
        },
        "1348752600": {
            "date": "27-09-2012",
            "open": 8.52,
            "high": 8.75,
            "low": 8.46,
            "close": 8.72,
            "adjclose": 8.5
        },
        "1348839000": {
            "date": "28-09-2012",
            "open": 8.72,
            "high": 8.83,
            "low": 8.61,
            "close": 8.8,
            "adjclose": 8.58
        },
        "1349098200": {
            "date": "01-10-2012",
            "open": 8.82,
            "high": 9,
            "low": 8.8,
            "close": 8.93,
            "adjclose": 8.71
        },
        "1349184600": {
            "date": "02-10-2012",
            "open": 8.94,
            "high": 9.03,
            "low": 8.91,
            "close": 9.02,
            "adjclose": 8.8
        },
        "1349271000": {
            "date": "03-10-2012",
            "open": 9.02,
            "high": 9.03,
            "low": 8.93,
            "close": 8.99,
            "adjclose": 8.76
        },
        "1349357400": {
            "date": "04-10-2012",
            "open": 8.97,
            "high": 9.44,
            "low": 8.97,
            "close": 9.39,
            "adjclose": 9.16
        },
        "1349443800": {
            "date": "05-10-2012",
            "open": 9.44,
            "high": 9.85,
            "low": 9.38,
            "close": 9.57,
            "adjclose": 9.33
        },
        "1349703000": {
            "date": "08-10-2012",
            "open": 9.53,
            "high": 9.56,
            "low": 9.39,
            "close": 9.44,
            "adjclose": 9.2
        },
        "1349789400": {
            "date": "09-10-2012",
            "open": 9.46,
            "high": 9.52,
            "low": 9.21,
            "close": 9.27,
            "adjclose": 9.04
        },
        "1349875800": {
            "date": "10-10-2012",
            "open": 9.33,
            "high": 9.35,
            "low": 9.16,
            "close": 9.18,
            "adjclose": 8.95
        },
        "1349962200": {
            "date": "11-10-2012",
            "open": 9.28,
            "high": 9.44,
            "low": 9.27,
            "close": 9.4,
            "adjclose": 9.17
        },
        "1350048600": {
            "date": "12-10-2012",
            "open": 9.44,
            "high": 9.46,
            "low": 9.23,
            "close": 9.34,
            "adjclose": 9.1
        },
        "1350307800": {
            "date": "15-10-2012",
            "open": 9.44,
            "high": 9.51,
            "low": 9.27,
            "close": 9.3,
            "adjclose": 9.07
        },
        "1350394200": {
            "date": "16-10-2012",
            "open": 9.35,
            "high": 9.74,
            "low": 9.35,
            "close": 9.72,
            "adjclose": 9.47
        },
        "1350480600": {
            "date": "17-10-2012",
            "open": 9.88,
            "high": 9.92,
            "low": 9.53,
            "close": 9.65,
            "adjclose": 9.41
        },
        "1350567000": {
            "date": "18-10-2012",
            "open": 9.66,
            "high": 9.82,
            "low": 9.54,
            "close": 9.72,
            "adjclose": 9.47
        },
        "1350653400": {
            "date": "19-10-2012",
            "open": 9.77,
            "high": 9.77,
            "low": 9.44,
            "close": 9.52,
            "adjclose": 9.28
        },
        "1350912600": {
            "date": "22-10-2012",
            "open": 9.53,
            "high": 9.62,
            "low": 9.44,
            "close": 9.59,
            "adjclose": 9.35
        },
        "1350999000": {
            "date": "23-10-2012",
            "open": 9.52,
            "high": 9.69,
            "low": 9.44,
            "close": 9.64,
            "adjclose": 9.4
        },
        "1351085400": {
            "date": "24-10-2012",
            "open": 9.66,
            "high": 9.85,
            "low": 9.58,
            "close": 9.83,
            "adjclose": 9.58
        },
        "1351171800": {
            "date": "25-10-2012",
            "open": 9.88,
            "high": 9.98,
            "low": 9.62,
            "close": 9.84,
            "adjclose": 9.59
        },
        "1351258200": {
            "date": "26-10-2012",
            "open": 9.75,
            "high": 9.84,
            "low": 9.61,
            "close": 9.69,
            "adjclose": 9.45
        },
        "1351521000": {
            "date": "29-10-2012",
            "open": 9.71,
            "high": 9.77,
            "low": 9.63,
            "close": 9.72,
            "adjclose": 9.48
        },
        "1351607400": {
            "date": "30-10-2012",
            "open": 9.72,
            "high": 9.76,
            "low": 9.67,
            "close": 9.69,
            "adjclose": 9.45
        },
        "1351693800": {
            "date": "31-10-2012",
            "open": 9.69,
            "high": 9.82,
            "low": 9.68,
            "close": 9.76,
            "adjclose": 9.51
        },
        "1352125800": {
            "date": "05-11-2012",
            "open": 9.95,
            "high": 9.95,
            "low": 9.67,
            "close": 9.74,
            "adjclose": 9.49
        },
        "1352212200": {
            "date": "06-11-2012",
            "open": 9.78,
            "high": 9.78,
            "low": 9.68,
            "close": 9.7,
            "adjclose": 9.45
        },
        "1352298600": {
            "date": "07-11-2012",
            "open": 9.69,
            "high": 9.74,
            "low": 9.5,
            "close": 9.63,
            "adjclose": 9.39
        },
        "1352385000": {
            "date": "08-11-2012",
            "open": 9.56,
            "high": 9.73,
            "low": 9.44,
            "close": 9.56,
            "adjclose": 9.32
        },
        "1352471400": {
            "date": "09-11-2012",
            "open": 9.53,
            "high": 9.61,
            "low": 9.38,
            "close": 9.41,
            "adjclose": 9.17
        },
        "1352730600": {
            "date": "12-11-2012",
            "open": 9.35,
            "high": 9.45,
            "low": 9.31,
            "close": 9.39,
            "adjclose": 9.16
        },
        "1352817000": {
            "date": "13-11-2012",
            "open": 9.37,
            "high": 9.58,
            "low": 9.33,
            "close": 9.5,
            "adjclose": 9.26
        },
        "1352903400": {
            "date": "14-11-2012",
            "open": 9.49,
            "high": 9.59,
            "low": 9.25,
            "close": 9.27,
            "adjclose": 9.04
        },
        "1352989800": {
            "date": "15-11-2012",
            "open": 9.12,
            "high": 9.43,
            "low": 9.06,
            "close": 9.31,
            "adjclose": 9.08
        },
        "1353076200": {
            "date": "16-11-2012",
            "open": 9.31,
            "high": 9.42,
            "low": 9.21,
            "close": 9.29,
            "adjclose": 9.05
        },
        "1353421800": {
            "date": "20-11-2012",
            "open": 9.52,
            "high": 9.77,
            "low": 9.52,
            "close": 9.69,
            "adjclose": 9.45
        },
        "1353508200": {
            "date": "21-11-2012",
            "open": 9.69,
            "high": 9.75,
            "low": 9.65,
            "close": 9.72,
            "adjclose": 9.47
        },
        "1353594600": {
            "date": "22-11-2012",
            "open": 9.73,
            "high": 9.79,
            "low": 9.72,
            "close": 9.76,
            "adjclose": 9.51
        },
        "1353681000": {
            "date": "23-11-2012",
            "open": 9.72,
            "high": 9.74,
            "low": 9.67,
            "close": 9.71,
            "adjclose": 9.46
        },
        "1353940200": {
            "date": "26-11-2012",
            "open": 9.68,
            "high": 9.74,
            "low": 9.58,
            "close": 9.7,
            "adjclose": 9.45
        },
        "1354026600": {
            "date": "27-11-2012",
            "open": 9.72,
            "high": 9.74,
            "low": 9.58,
            "close": 9.62,
            "adjclose": 9.38
        },
        "1354113000": {
            "date": "28-11-2012",
            "open": 9.62,
            "high": 9.74,
            "low": 9.57,
            "close": 9.7,
            "adjclose": 9.45
        },
        "1354199400": {
            "date": "29-11-2012",
            "open": 9.74,
            "high": 9.74,
            "low": 9.62,
            "close": 9.64,
            "adjclose": 9.4
        },
        "1354285800": {
            "date": "30-11-2012",
            "open": 9.63,
            "high": 9.7,
            "low": 9.43,
            "close": 9.47,
            "adjclose": 9.23
        },
        "1354545000": {
            "date": "03-12-2012",
            "open": 9.58,
            "high": 9.74,
            "low": 9.55,
            "close": 9.59,
            "adjclose": 9.35
        },
        "1354631400": {
            "date": "04-12-2012",
            "open": 9.58,
            "high": 9.61,
            "low": 9.52,
            "close": 9.54,
            "adjclose": 9.3
        },
        "1354717800": {
            "date": "05-12-2012",
            "open": 9.54,
            "high": 9.6,
            "low": 9.49,
            "close": 9.53,
            "adjclose": 9.29
        },
        "1354804200": {
            "date": "06-12-2012",
            "open": 9.53,
            "high": 9.62,
            "low": 9.47,
            "close": 9.58,
            "adjclose": 9.34
        },
        "1354890600": {
            "date": "07-12-2012",
            "open": 9.64,
            "high": 9.64,
            "low": 9.51,
            "close": 9.58,
            "adjclose": 9.33
        },
        "1355149800": {
            "date": "10-12-2012",
            "open": 9.54,
            "high": 9.57,
            "low": 9.48,
            "close": 9.52,
            "adjclose": 9.28
        },
        "1355236200": {
            "date": "11-12-2012",
            "open": 9.56,
            "high": 9.62,
            "low": 9.49,
            "close": 9.52,
            "adjclose": 9.28
        },
        "1355409000": {
            "date": "13-12-2012",
            "open": 9.49,
            "high": 9.59,
            "low": 9.49,
            "close": 9.56,
            "adjclose": 9.32
        },
        "1355495400": {
            "date": "14-12-2012",
            "open": 9.59,
            "high": 9.67,
            "low": 9.5,
            "close": 9.64,
            "adjclose": 9.4
        },
        "1355754600": {
            "date": "17-12-2012",
            "open": 9.66,
            "high": 10.13,
            "low": 9.66,
            "close": 10.09,
            "adjclose": 9.84
        },
        "1355841000": {
            "date": "18-12-2012",
            "open": 10.15,
            "high": 10.32,
            "low": 10.09,
            "close": 10.21,
            "adjclose": 9.95
        },
        "1355927400": {
            "date": "19-12-2012",
            "open": 10.24,
            "high": 10.52,
            "low": 10.18,
            "close": 10.5,
            "adjclose": 10.24
        },
        "1356013800": {
            "date": "20-12-2012",
            "open": 10.51,
            "high": 10.63,
            "low": 10.44,
            "close": 10.47,
            "adjclose": 10.21
        },
        "1356100200": {
            "date": "21-12-2012",
            "open": 10.29,
            "high": 10.45,
            "low": 10.22,
            "close": 10.43,
            "adjclose": 10.17
        },
        "1356363000": {
            "date": "24-12-2012",
            "open": 0,
            "high": 0,
            "low": 0,
            "close": 0
        },
        "1356532200": {
            "date": "26-12-2012",
            "open": 10.36,
            "high": 10.47,
            "low": 10.36,
            "close": 10.39,
            "adjclose": 10.13
        },
        "1356618600": {
            "date": "27-12-2012",
            "open": 10.43,
            "high": 10.45,
            "low": 10.27,
            "close": 10.4,
            "adjclose": 10.13
        },
        "1356705000": {
            "date": "28-12-2012",
            "open": 10.44,
            "high": 10.45,
            "low": 10.27,
            "close": 10.41,
            "adjclose": 10.14
        },
        "1356964200": {
            "date": "31-12-2012",
            "open": 10.41,
            "high": 10.46,
            "low": 10.27,
            "close": 10.44,
            "adjclose": 10.17
        },
        "1357137000": {
            "date": "02-01-2013",
            "open": 10.64,
            "high": 11.01,
            "low": 10.64,
            "close": 10.91,
            "adjclose": 10.63
        },
        "1357223400": {
            "date": "03-01-2013",
            "open": 10.91,
            "high": 11.05,
            "low": 10.77,
            "close": 10.82,
            "adjclose": 10.54
        },
        "1357309800": {
            "date": "04-01-2013",
            "open": 10.82,
            "high": 10.97,
            "low": 10.77,
            "close": 10.87,
            "adjclose": 10.59
        },
        "1357569000": {
            "date": "07-01-2013",
            "open": 10.79,
            "high": 10.98,
            "low": 10.78,
            "close": 10.95,
            "adjclose": 10.67
        },
        "1357655400": {
            "date": "08-01-2013",
            "open": 10.89,
            "high": 11.01,
            "low": 10.82,
            "close": 10.94,
            "adjclose": 10.66
        },
        "1357741800": {
            "date": "09-01-2013",
            "open": 10.96,
            "high": 11.06,
            "low": 10.89,
            "close": 11.05,
            "adjclose": 10.77
        },
        "1357828200": {
            "date": "10-01-2013",
            "open": 11.08,
            "high": 11.18,
            "low": 10.94,
            "close": 10.98,
            "adjclose": 10.7
        },
        "1357914600": {
            "date": "11-01-2013",
            "open": 10.97,
            "high": 11.01,
            "low": 10.9,
            "close": 10.94,
            "adjclose": 10.66
        },
        "1358173800": {
            "date": "14-01-2013",
            "open": 10.82,
            "high": 10.98,
            "low": 10.76,
            "close": 10.78,
            "adjclose": 10.51
        },
        "1358260200": {
            "date": "15-01-2013",
            "open": 10.76,
            "high": 10.82,
            "low": 10.64,
            "close": 10.68,
            "adjclose": 10.41
        },
        "1358346600": {
            "date": "16-01-2013",
            "open": 10.69,
            "high": 10.82,
            "low": 10.68,
            "close": 10.79,
            "adjclose": 10.52
        },
        "1358433000": {
            "date": "17-01-2013",
            "open": 10.68,
            "high": 10.92,
            "low": 10.63,
            "close": 10.69,
            "adjclose": 10.42
        },
        "1358519400": {
            "date": "18-01-2013",
            "open": 10.69,
            "high": 10.87,
            "low": 10.66,
            "close": 10.81,
            "adjclose": 10.54
        },
        "1358778600": {
            "date": "21-01-2013",
            "open": 10.88,
            "high": 10.93,
            "low": 10.8,
            "close": 10.91,
            "adjclose": 10.63
        },
        "1358865000": {
            "date": "22-01-2013",
            "open": 10.91,
            "high": 10.92,
            "low": 10.8,
            "close": 10.82,
            "adjclose": 10.54
        },
        "1358951400": {
            "date": "23-01-2013",
            "open": 10.81,
            "high": 11.05,
            "low": 10.78,
            "close": 11.04,
            "adjclose": 10.76
        },
        "1359037800": {
            "date": "24-01-2013",
            "open": 10.97,
            "high": 11.3,
            "low": 10.97,
            "close": 11.23,
            "adjclose": 10.94
        },
        "1359124200": {
            "date": "25-01-2013",
            "open": 11.19,
            "high": 11.31,
            "low": 11.15,
            "close": 11.19,
            "adjclose": 10.91
        },
        "1359383400": {
            "date": "28-01-2013",
            "open": 11.22,
            "high": 11.3,
            "low": 11.13,
            "close": 11.28,
            "adjclose": 10.99
        },
        "1359469800": {
            "date": "29-01-2013",
            "open": 11.26,
            "high": 11.72,
            "low": 11.19,
            "close": 11.67,
            "adjclose": 11.38
        },
        "1359556200": {
            "date": "30-01-2013",
            "open": 11.66,
            "high": 11.76,
            "low": 11.39,
            "close": 11.42,
            "adjclose": 11.13
        },
        "1359642600": {
            "date": "31-01-2013",
            "open": 11.34,
            "high": 11.44,
            "low": 11.29,
            "close": 11.4,
            "adjclose": 11.11
        },
        "1359729000": {
            "date": "01-02-2013",
            "open": 11.43,
            "high": 11.54,
            "low": 11.35,
            "close": 11.39,
            "adjclose": 11.1
        },
        "1360074600": {
            "date": "05-02-2013",
            "open": 11.38,
            "high": 11.38,
            "low": 11.11,
            "close": 11.21,
            "adjclose": 10.93
        },
        "1360161000": {
            "date": "06-02-2013",
            "open": 11.22,
            "high": 11.39,
            "low": 11.22,
            "close": 11.35,
            "adjclose": 11.06
        },
        "1360247400": {
            "date": "07-02-2013",
            "open": 10.99,
            "high": 11.24,
            "low": 10.82,
            "close": 10.88,
            "adjclose": 10.61
        },
        "1360333800": {
            "date": "08-02-2013",
            "open": 10.91,
            "high": 10.98,
            "low": 10.81,
            "close": 10.92,
            "adjclose": 10.64
        },
        "1360593000": {
            "date": "11-02-2013",
            "open": 10.92,
            "high": 11,
            "low": 10.78,
            "close": 10.78,
            "adjclose": 10.51
        },
        "1360679400": {
            "date": "12-02-2013",
            "open": 10.92,
            "high": 11.05,
            "low": 10.8,
            "close": 10.99,
            "adjclose": 10.71
        },
        "1360765800": {
            "date": "13-02-2013",
            "open": 10.96,
            "high": 11.24,
            "low": 10.96,
            "close": 11.19,
            "adjclose": 10.91
        },
        "1360852200": {
            "date": "14-02-2013",
            "open": 11.18,
            "high": 11.54,
            "low": 11.18,
            "close": 11.48,
            "adjclose": 11.19
        },
        "1360938600": {
            "date": "15-02-2013",
            "open": 11.51,
            "high": 11.55,
            "low": 11.34,
            "close": 11.42,
            "adjclose": 11.14
        },
        "1361197800": {
            "date": "18-02-2013",
            "open": 11.38,
            "high": 11.42,
            "low": 11.31,
            "close": 11.34,
            "adjclose": 11.06
        },
        "1361284200": {
            "date": "19-02-2013",
            "open": 11.38,
            "high": 11.44,
            "low": 11.33,
            "close": 11.39,
            "adjclose": 11.1
        },
        "1361370600": {
            "date": "20-02-2013",
            "open": 11.38,
            "high": 11.53,
            "low": 10.97,
            "close": 11.02,
            "adjclose": 10.74
        },
        "1361457000": {
            "date": "21-02-2013",
            "open": 11,
            "high": 11.02,
            "low": 10.35,
            "close": 10.8,
            "adjclose": 10.53
        },
        "1361543400": {
            "date": "22-02-2013",
            "open": 10.88,
            "high": 11.04,
            "low": 10.75,
            "close": 10.85,
            "adjclose": 10.58
        },
        "1361802600": {
            "date": "25-02-2013",
            "open": 10.85,
            "high": 11.01,
            "low": 10.64,
            "close": 10.69,
            "adjclose": 10.42
        },
        "1361889000": {
            "date": "26-02-2013",
            "open": 10.76,
            "high": 10.82,
            "low": 10.6,
            "close": 10.8,
            "adjclose": 10.53
        },
        "1361975400": {
            "date": "27-02-2013",
            "open": 10.84,
            "high": 11.22,
            "low": 10.8,
            "close": 11.19,
            "adjclose": 10.91
        },
        "1362061800": {
            "date": "28-02-2013",
            "open": 11.19,
            "high": 11.38,
            "low": 11.12,
            "close": 11.28,
            "adjclose": 10.99
        },
        "1362148200": {
            "date": "01-03-2013",
            "open": 11.26,
            "high": 11.56,
            "low": 11.16,
            "close": 11.52,
            "adjclose": 11.23
        },
        "1362407400": {
            "date": "04-03-2013",
            "open": 11.51,
            "high": 11.61,
            "low": 11.43,
            "close": 11.58,
            "adjclose": 11.29
        },
        "1362493800": {
            "date": "05-03-2013",
            "open": 11.61,
            "high": 12.07,
            "low": 11.61,
            "close": 11.81,
            "adjclose": 11.51
        },
        "1362580200": {
            "date": "06-03-2013",
            "open": 11.89,
            "high": 12.04,
            "low": 11.82,
            "close": 12,
            "adjclose": 11.7
        },
        "1362666600": {
            "date": "07-03-2013",
            "open": 12,
            "high": 12.23,
            "low": 11.93,
            "close": 12.17,
            "adjclose": 11.87
        },
        "1362753000": {
            "date": "08-03-2013",
            "open": 12.21,
            "high": 12.46,
            "low": 12.07,
            "close": 12.42,
            "adjclose": 12.11
        },
        "1363012200": {
            "date": "11-03-2013",
            "open": 12.41,
            "high": 12.41,
            "low": 12.24,
            "close": 12.28,
            "adjclose": 11.97
        },
        "1363098600": {
            "date": "12-03-2013",
            "open": 12.2,
            "high": 12.43,
            "low": 12.18,
            "close": 12.36,
            "adjclose": 12.05
        },
        "1363185000": {
            "date": "13-03-2013",
            "open": 12.43,
            "high": 12.43,
            "low": 12.12,
            "close": 12.25,
            "adjclose": 11.94
        },
        "1363271400": {
            "date": "14-03-2013",
            "open": 12.27,
            "high": 12.49,
            "low": 12.18,
            "close": 12.34,
            "adjclose": 12.03
        },
        "1363357800": {
            "date": "15-03-2013",
            "open": 12.37,
            "high": 12.78,
            "low": 12.35,
            "close": 12.7,
            "adjclose": 12.38
        },
        "1363703400": {
            "date": "19-03-2013",
            "open": 12.67,
            "high": 12.67,
            "low": 12.21,
            "close": 12.3,
            "adjclose": 11.99
        },
        "1363789800": {
            "date": "20-03-2013",
            "open": 12.33,
            "high": 12.56,
            "low": 12.33,
            "close": 12.52,
            "adjclose": 12.2
        },
        "1363876200": {
            "date": "21-03-2013",
            "open": 12.5,
            "high": 12.53,
            "low": 12.4,
            "close": 12.44,
            "adjclose": 12.13
        },
        "1363962600": {
            "date": "22-03-2013",
            "open": 12.49,
            "high": 12.5,
            "low": 12.33,
            "close": 12.42,
            "adjclose": 12.11
        },
        "1364221800": {
            "date": "25-03-2013",
            "open": 12.43,
            "high": 12.55,
            "low": 12.3,
            "close": 12.35,
            "adjclose": 12.03
        },
        "1364308200": {
            "date": "26-03-2013",
            "open": 12.38,
            "high": 12.45,
            "low": 12.3,
            "close": 12.44,
            "adjclose": 12.12
        },
        "1364394600": {
            "date": "27-03-2013",
            "open": 12.38,
            "high": 12.43,
            "low": 12.21,
            "close": 12.35,
            "adjclose": 12.04
        },
        "1364826600": {
            "date": "01-04-2013",
            "open": 12.35,
            "high": 12.49,
            "low": 12.35,
            "close": 12.46,
            "adjclose": 12.15
        },
        "1364913000": {
            "date": "02-04-2013",
            "open": 12.46,
            "high": 12.57,
            "low": 12.35,
            "close": 12.39,
            "adjclose": 12.07
        },
        "1364999400": {
            "date": "03-04-2013",
            "open": 12.37,
            "high": 12.39,
            "low": 11.86,
            "close": 11.94,
            "adjclose": 11.64
        },
        "1365085800": {
            "date": "04-04-2013",
            "open": 12.1,
            "high": 12.12,
            "low": 11.79,
            "close": 11.83,
            "adjclose": 11.53
        },
        "1365172200": {
            "date": "05-04-2013",
            "open": 11.82,
            "high": 12.49,
            "low": 11.52,
            "close": 12.44,
            "adjclose": 12.13
        },
        "1365427800": {
            "date": "08-04-2013",
            "open": 12.41,
            "high": 12.65,
            "low": 12.37,
            "close": 12.64,
            "adjclose": 12.32
        },
        "1365514200": {
            "date": "09-04-2013",
            "open": 12.58,
            "high": 12.67,
            "low": 12.44,
            "close": 12.53,
            "adjclose": 12.22
        },
        "1365600600": {
            "date": "10-04-2013",
            "open": 12.57,
            "high": 12.57,
            "low": 12.33,
            "close": 12.39,
            "adjclose": 12.07
        },
        "1365687000": {
            "date": "11-04-2013",
            "open": 12.38,
            "high": 12.45,
            "low": 12.28,
            "close": 12.35,
            "adjclose": 12.04
        },
        "1365773400": {
            "date": "12-04-2013",
            "open": 12.33,
            "high": 12.41,
            "low": 12.1,
            "close": 12.18,
            "adjclose": 11.87
        },
        "1366032600": {
            "date": "15-04-2013",
            "open": 11.72,
            "high": 12.19,
            "low": 11.59,
            "close": 11.63,
            "adjclose": 11.34
        },
        "1366119000": {
            "date": "16-04-2013",
            "open": 11.75,
            "high": 11.9,
            "low": 11.7,
            "close": 11.78,
            "adjclose": 11.48
        },
        "1366205400": {
            "date": "17-04-2013",
            "open": 11.75,
            "high": 11.77,
            "low": 11.51,
            "close": 11.58,
            "adjclose": 11.29
        },
        "1366291800": {
            "date": "18-04-2013",
            "open": 11.52,
            "high": 11.66,
            "low": 11.19,
            "close": 11.24,
            "adjclose": 10.95
        },
        "1366378200": {
            "date": "19-04-2013",
            "open": 11.4,
            "high": 11.51,
            "low": 11.24,
            "close": 11.47,
            "adjclose": 11.18
        },
        "1366637400": {
            "date": "22-04-2013",
            "open": 11.48,
            "high": 11.64,
            "low": 11.28,
            "close": 11.42,
            "adjclose": 11.13
        },
        "1366723800": {
            "date": "23-04-2013",
            "open": 11.57,
            "high": 11.76,
            "low": 11.55,
            "close": 11.72,
            "adjclose": 11.42
        },
        "1366810200": {
            "date": "24-04-2013",
            "open": 11.72,
            "high": 11.83,
            "low": 11.63,
            "close": 11.73,
            "adjclose": 11.43
        },
        "1366896600": {
            "date": "25-04-2013",
            "open": 11.67,
            "high": 11.95,
            "low": 11.65,
            "close": 11.79,
            "adjclose": 11.49
        },
        "1366983000": {
            "date": "26-04-2013",
            "open": 11.53,
            "high": 12.31,
            "low": 11.48,
            "close": 12.02,
            "adjclose": 11.72
        },
        "1367242200": {
            "date": "29-04-2013",
            "open": 11.96,
            "high": 12.03,
            "low": 11.63,
            "close": 11.7,
            "adjclose": 11.41
        },
        "1367328600": {
            "date": "30-04-2013",
            "open": 11.82,
            "high": 11.82,
            "low": 11.63,
            "close": 11.7,
            "adjclose": 11.41
        },
        "1367501400": {
            "date": "02-05-2013",
            "open": 11.66,
            "high": 11.88,
            "low": 11.63,
            "close": 11.84,
            "adjclose": 11.54
        },
        "1367587800": {
            "date": "03-05-2013",
            "open": 11.91,
            "high": 12.62,
            "low": 11.91,
            "close": 12.31,
            "adjclose": 12
        },
        "1367847000": {
            "date": "06-05-2013",
            "open": 12.35,
            "high": 12.42,
            "low": 12.26,
            "close": 12.39,
            "adjclose": 12.07
        },
        "1367933400": {
            "date": "07-05-2013",
            "open": 12.39,
            "high": 12.57,
            "low": 12.31,
            "close": 12.37,
            "adjclose": 12.06
        },
        "1368019800": {
            "date": "08-05-2013",
            "open": 12.41,
            "high": 12.41,
            "low": 12.1,
            "close": 12.14,
            "adjclose": 11.83
        },
        "1368106200": {
            "date": "09-05-2013",
            "open": 12.22,
            "high": 12.25,
            "low": 11.88,
            "close": 11.93,
            "adjclose": 11.63
        },
        "1368192600": {
            "date": "10-05-2013",
            "open": 11.99,
            "high": 12.43,
            "low": 11.99,
            "close": 12.4,
            "adjclose": 12.09
        },
        "1368451800": {
            "date": "13-05-2013",
            "open": 12.44,
            "high": 12.44,
            "low": 12.25,
            "close": 12.33,
            "adjclose": 12.02
        },
        "1368538200": {
            "date": "14-05-2013",
            "open": 12.33,
            "high": 12.58,
            "low": 12.26,
            "close": 12.57,
            "adjclose": 12.25
        },
        "1368624600": {
            "date": "15-05-2013",
            "open": 12.59,
            "high": 13.14,
            "low": 12.48,
            "close": 12.94,
            "adjclose": 12.61
        },
        "1368711000": {
            "date": "16-05-2013",
            "open": 12.87,
            "high": 13.11,
            "low": 12.77,
            "close": 12.94,
            "adjclose": 12.61
        },
        "1368797400": {
            "date": "17-05-2013",
            "open": 13.12,
            "high": 13.17,
            "low": 12.92,
            "close": 13.01,
            "adjclose": 12.68
        },
        "1369056600": {
            "date": "20-05-2013",
            "open": 13.08,
            "high": 13.08,
            "low": 12.63,
            "close": 12.72,
            "adjclose": 12.4
        },
        "1369143000": {
            "date": "21-05-2013",
            "open": 12.75,
            "high": 12.8,
            "low": 12.25,
            "close": 12.47,
            "adjclose": 12.16
        },
        "1369229400": {
            "date": "22-05-2013",
            "open": 12.36,
            "high": 12.72,
            "low": 12.16,
            "close": 12.2,
            "adjclose": 11.89
        },
        "1369315800": {
            "date": "23-05-2013",
            "open": 12.14,
            "high": 12.28,
            "low": 11.86,
            "close": 12.16,
            "adjclose": 11.86
        },
        "1369402200": {
            "date": "24-05-2013",
            "open": 12.1,
            "high": 12.38,
            "low": 11.92,
            "close": 12.27,
            "adjclose": 11.96
        },
        "1369661400": {
            "date": "27-05-2013",
            "open": 12.28,
            "high": 12.34,
            "low": 12.08,
            "close": 12.14,
            "adjclose": 11.83
        },
        "1369747800": {
            "date": "28-05-2013",
            "open": 12.31,
            "high": 12.42,
            "low": 12.15,
            "close": 12.22,
            "adjclose": 11.92
        },
        "1369834200": {
            "date": "29-05-2013",
            "open": 12.22,
            "high": 12.41,
            "low": 12.19,
            "close": 12.28,
            "adjclose": 11.97
        },
        "1369920600": {
            "date": "30-05-2013",
            "open": 12.34,
            "high": 12.74,
            "low": 12.33,
            "close": 12.64,
            "adjclose": 12.32
        },
        "1370007000": {
            "date": "31-05-2013",
            "open": 12.63,
            "high": 12.82,
            "low": 12.49,
            "close": 12.76,
            "adjclose": 12.44
        },
        "1370266200": {
            "date": "03-06-2013",
            "open": 12.63,
            "high": 12.7,
            "low": 12.1,
            "close": 12.22,
            "adjclose": 11.92
        },
        "1370352600": {
            "date": "04-06-2013",
            "open": 12.28,
            "high": 12.43,
            "low": 11.87,
            "close": 11.92,
            "adjclose": 11.62
        },
        "1370439000": {
            "date": "05-06-2013",
            "open": 12.02,
            "high": 12.02,
            "low": 11.63,
            "close": 11.71,
            "adjclose": 11.42
        },
        "1370525400": {
            "date": "06-06-2013",
            "open": 11.78,
            "high": 11.9,
            "low": 11.63,
            "close": 11.87,
            "adjclose": 11.57
        },
        "1370611800": {
            "date": "07-06-2013",
            "open": 11.92,
            "high": 12.15,
            "low": 11.88,
            "close": 11.95,
            "adjclose": 11.65
        },
        "1370871000": {
            "date": "10-06-2013",
            "open": 12,
            "high": 12.15,
            "low": 11.83,
            "close": 12.09,
            "adjclose": 11.78
        },
        "1370957400": {
            "date": "11-06-2013",
            "open": 11.97,
            "high": 12.05,
            "low": 11.49,
            "close": 11.53,
            "adjclose": 11.24
        },
        "1371043800": {
            "date": "12-06-2013",
            "open": 11.7,
            "high": 11.7,
            "low": 11.24,
            "close": 11.32,
            "adjclose": 11.03
        },
        "1371130200": {
            "date": "13-06-2013",
            "open": 11.34,
            "high": 11.54,
            "low": 11.24,
            "close": 11.49,
            "adjclose": 11.2
        },
        "1371216600": {
            "date": "14-06-2013",
            "open": 11.49,
            "high": 11.55,
            "low": 11.33,
            "close": 11.39,
            "adjclose": 11.1
        },
        "1371475800": {
            "date": "17-06-2013",
            "open": 11.45,
            "high": 11.57,
            "low": 11.27,
            "close": 11.3,
            "adjclose": 11.02
        },
        "1371562200": {
            "date": "18-06-2013",
            "open": 11.28,
            "high": 11.69,
            "low": 11.28,
            "close": 11.6,
            "adjclose": 11.31
        },
        "1371648600": {
            "date": "19-06-2013",
            "open": 11.63,
            "high": 11.94,
            "low": 11.63,
            "close": 11.82,
            "adjclose": 11.52
        },
        "1371735000": {
            "date": "20-06-2013",
            "open": 11.71,
            "high": 11.94,
            "low": 11.33,
            "close": 11.39,
            "adjclose": 11.1
        },
        "1371821400": {
            "date": "21-06-2013",
            "open": 11.47,
            "high": 11.5,
            "low": 10.77,
            "close": 11.23,
            "adjclose": 10.95
        },
        "1372080600": {
            "date": "24-06-2013",
            "open": 11.11,
            "high": 11.14,
            "low": 10.75,
            "close": 10.94,
            "adjclose": 10.67
        },
        "1372167000": {
            "date": "25-06-2013",
            "open": 11.08,
            "high": 11.39,
            "low": 11.07,
            "close": 11.32,
            "adjclose": 11.03
        },
        "1372253400": {
            "date": "26-06-2013",
            "open": 11.44,
            "high": 11.77,
            "low": 11.34,
            "close": 11.71,
            "adjclose": 11.42
        },
        "1372339800": {
            "date": "27-06-2013",
            "open": 11.77,
            "high": 11.9,
            "low": 11.62,
            "close": 11.8,
            "adjclose": 11.5
        },
        "1372426200": {
            "date": "28-06-2013",
            "open": 11.86,
            "high": 11.86,
            "low": 11.65,
            "close": 11.76,
            "adjclose": 11.47
        },
        "1372685400": {
            "date": "01-07-2013",
            "open": 11.76,
            "high": 11.97,
            "low": 11.76,
            "close": 11.89,
            "adjclose": 11.59
        },
        "1372771800": {
            "date": "02-07-2013",
            "open": 11.8,
            "high": 11.9,
            "low": 11.39,
            "close": 11.55,
            "adjclose": 11.26
        },
        "1372858200": {
            "date": "03-07-2013",
            "open": 11.46,
            "high": 11.67,
            "low": 11.39,
            "close": 11.56,
            "adjclose": 11.27
        },
        "1372944600": {
            "date": "04-07-2013",
            "open": 11.66,
            "high": 11.77,
            "low": 11.64,
            "close": 11.7,
            "adjclose": 11.41
        },
        "1373031000": {
            "date": "05-07-2013",
            "open": 11.75,
            "high": 11.75,
            "low": 11.39,
            "close": 11.63,
            "adjclose": 11.34
        },
        "1373290200": {
            "date": "08-07-2013",
            "open": 11.77,
            "high": 11.8,
            "low": 11.45,
            "close": 11.49,
            "adjclose": 11.2
        },
        "1373376600": {
            "date": "09-07-2013",
            "open": 11.47,
            "high": 11.64,
            "low": 11.42,
            "close": 11.6,
            "adjclose": 11.31
        },
        "1373463000": {
            "date": "10-07-2013",
            "open": 11.54,
            "high": 11.69,
            "low": 11.51,
            "close": 11.63,
            "adjclose": 11.33
        },
        "1373549400": {
            "date": "11-07-2013",
            "open": 11.7,
            "high": 12.18,
            "low": 11.7,
            "close": 12.16,
            "adjclose": 11.85
        },
        "1373635800": {
            "date": "12-07-2013",
            "open": 12.1,
            "high": 12.44,
            "low": 11.99,
            "close": 12.39,
            "adjclose": 12.08
        },
        "1373895000": {
            "date": "15-07-2013",
            "open": 12.32,
            "high": 12.42,
            "low": 12.18,
            "close": 12.22,
            "adjclose": 11.91
        },
        "1373981400": {
            "date": "16-07-2013",
            "open": 12.22,
            "high": 12.22,
            "low": 11.81,
            "close": 11.94,
            "adjclose": 11.64
        },
        "1374067800": {
            "date": "17-07-2013",
            "open": 12,
            "high": 12.07,
            "low": 11.8,
            "close": 12.05,
            "adjclose": 11.75
        },
        "1374154200": {
            "date": "18-07-2013",
            "open": 12.05,
            "high": 12.31,
            "low": 12.04,
            "close": 12.16,
            "adjclose": 11.85
        },
        "1374240600": {
            "date": "19-07-2013",
            "open": 12.1,
            "high": 12.22,
            "low": 12.04,
            "close": 12.19,
            "adjclose": 11.88
        },
        "1374499800": {
            "date": "22-07-2013",
            "open": 12.16,
            "high": 12.37,
            "low": 12.06,
            "close": 12.31,
            "adjclose": 12
        },
        "1374586200": {
            "date": "23-07-2013",
            "open": 12.33,
            "high": 12.45,
            "low": 12.21,
            "close": 12.26,
            "adjclose": 11.95
        },
        "1374672600": {
            "date": "24-07-2013",
            "open": 12.27,
            "high": 12.44,
            "low": 12.22,
            "close": 12.28,
            "adjclose": 11.97
        },
        "1374759000": {
            "date": "25-07-2013",
            "open": 12.35,
            "high": 12.72,
            "low": 12.35,
            "close": 12.46,
            "adjclose": 12.15
        },
        "1374845400": {
            "date": "26-07-2013",
            "open": 12.51,
            "high": 12.9,
            "low": 12.5,
            "close": 12.63,
            "adjclose": 12.32
        },
        "1375104600": {
            "date": "29-07-2013",
            "open": 12.69,
            "high": 12.72,
            "low": 12.39,
            "close": 12.43,
            "adjclose": 12.12
        },
        "1375191000": {
            "date": "30-07-2013",
            "open": 12.4,
            "high": 12.51,
            "low": 12.16,
            "close": 12.39,
            "adjclose": 12.08
        },
        "1375277400": {
            "date": "31-07-2013",
            "open": 12.41,
            "high": 12.7,
            "low": 12.41,
            "close": 12.58,
            "adjclose": 12.27
        },
        "1375363800": {
            "date": "01-08-2013",
            "open": 12.65,
            "high": 13.09,
            "low": 12.65,
            "close": 13.03,
            "adjclose": 12.7
        },
        "1375450200": {
            "date": "02-08-2013",
            "open": 12.99,
            "high": 13.1,
            "low": 12.82,
            "close": 12.93,
            "adjclose": 12.61
        },
        "1375709400": {
            "date": "05-08-2013",
            "open": 12.95,
            "high": 13.08,
            "low": 12.87,
            "close": 13.05,
            "adjclose": 12.72
        },
        "1375795800": {
            "date": "06-08-2013",
            "open": 13.04,
            "high": 13.13,
            "low": 12.94,
            "close": 13.06,
            "adjclose": 12.73
        },
        "1375882200": {
            "date": "07-08-2013",
            "open": 12.96,
            "high": 12.99,
            "low": 12.82,
            "close": 12.92,
            "adjclose": 12.59
        },
        "1375968600": {
            "date": "08-08-2013",
            "open": 12.92,
            "high": 13.31,
            "low": 12.92,
            "close": 13.22,
            "adjclose": 12.89
        },
        "1376055000": {
            "date": "09-08-2013",
            "open": 13.21,
            "high": 13.33,
            "low": 13,
            "close": 13.14,
            "adjclose": 12.81
        },
        "1376314200": {
            "date": "12-08-2013",
            "open": 13.16,
            "high": 13.39,
            "low": 13.12,
            "close": 13.16,
            "adjclose": 12.83
        },
        "1376400600": {
            "date": "13-08-2013",
            "open": 13.21,
            "high": 13.53,
            "low": 13.21,
            "close": 13.5,
            "adjclose": 13.16
        },
        "1376487000": {
            "date": "14-08-2013",
            "open": 13.52,
            "high": 13.65,
            "low": 13.48,
            "close": 13.57,
            "adjclose": 13.22
        },
        "1376573400": {
            "date": "15-08-2013",
            "open": 13.51,
            "high": 13.51,
            "low": 13.21,
            "close": 13.28,
            "adjclose": 12.94
        },
        "1376659800": {
            "date": "16-08-2013",
            "open": 13.33,
            "high": 13.45,
            "low": 13.27,
            "close": 13.32,
            "adjclose": 12.98
        },
        "1376919000": {
            "date": "19-08-2013",
            "open": 13.33,
            "high": 13.61,
            "low": 13.32,
            "close": 13.51,
            "adjclose": 13.17
        },
        "1377005400": {
            "date": "20-08-2013",
            "open": 13.51,
            "high": 13.68,
            "low": 13.34,
            "close": 13.58,
            "adjclose": 13.24
        },
        "1377091800": {
            "date": "21-08-2013",
            "open": 13.51,
            "high": 13.66,
            "low": 13.36,
            "close": 13.54,
            "adjclose": 13.2
        },
        "1377178200": {
            "date": "22-08-2013",
            "open": 13.62,
            "high": 13.68,
            "low": 13.51,
            "close": 13.6,
            "adjclose": 13.26
        },
        "1377264600": {
            "date": "23-08-2013",
            "open": 13.35,
            "high": 13.66,
            "low": 13.31,
            "close": 13.49,
            "adjclose": 13.15
        },
        "1377523800": {
            "date": "26-08-2013",
            "open": 13.42,
            "high": 13.49,
            "low": 13.13,
            "close": 13.16,
            "adjclose": 12.83
        },
        "1377610200": {
            "date": "27-08-2013",
            "open": 13.16,
            "high": 13.16,
            "low": 12.73,
            "close": 12.77,
            "adjclose": 12.45
        },
        "1377696600": {
            "date": "28-08-2013",
            "open": 12.82,
            "high": 12.95,
            "low": 12.7,
            "close": 12.73,
            "adjclose": 12.41
        },
        "1377783000": {
            "date": "29-08-2013",
            "open": 12.8,
            "high": 13.03,
            "low": 12.7,
            "close": 12.76,
            "adjclose": 12.44
        },
        "1377869400": {
            "date": "30-08-2013",
            "open": 12.75,
            "high": 13.81,
            "low": 12.67,
            "close": 12.97,
            "adjclose": 12.64
        },
        "1378128600": {
            "date": "02-09-2013",
            "open": 12.82,
            "high": 13.25,
            "low": 12.82,
            "close": 13.22,
            "adjclose": 12.88
        },
        "1378215000": {
            "date": "03-09-2013",
            "open": 13.34,
            "high": 13.34,
            "low": 12.87,
            "close": 12.88,
            "adjclose": 12.56
        },
        "1378301400": {
            "date": "04-09-2013",
            "open": 12.91,
            "high": 12.93,
            "low": 12.68,
            "close": 12.72,
            "adjclose": 12.4
        },
        "1378387800": {
            "date": "05-09-2013",
            "open": 12.7,
            "high": 12.87,
            "low": 12.69,
            "close": 12.72,
            "adjclose": 12.4
        },
        "1378474200": {
            "date": "06-09-2013",
            "open": 12.73,
            "high": 12.88,
            "low": 12.56,
            "close": 12.85,
            "adjclose": 12.52
        },
        "1378733400": {
            "date": "09-09-2013",
            "open": 12.81,
            "high": 13.03,
            "low": 12.78,
            "close": 12.88,
            "adjclose": 12.56
        },
        "1378819800": {
            "date": "10-09-2013",
            "open": 12.96,
            "high": 13.16,
            "low": 12.91,
            "close": 13.13,
            "adjclose": 12.8
        },
        "1378906200": {
            "date": "11-09-2013",
            "open": 13.1,
            "high": 13.21,
            "low": 13.09,
            "close": 13.15,
            "adjclose": 12.81
        },
        "1378992600": {
            "date": "12-09-2013",
            "open": 13.15,
            "high": 13.2,
            "low": 12.87,
            "close": 12.9,
            "adjclose": 12.57
        },
        "1379079000": {
            "date": "13-09-2013",
            "open": 12.91,
            "high": 13.02,
            "low": 12.82,
            "close": 12.98,
            "adjclose": 12.65
        },
        "1379424600": {
            "date": "17-09-2013",
            "open": 12.72,
            "high": 12.8,
            "low": 12.6,
            "close": 12.75,
            "adjclose": 12.43
        },
        "1379511000": {
            "date": "18-09-2013",
            "open": 12.8,
            "high": 12.99,
            "low": 12.6,
            "close": 12.96,
            "adjclose": 12.63
        },
        "1379597400": {
            "date": "19-09-2013",
            "open": 13.05,
            "high": 13.36,
            "low": 12.99,
            "close": 13.14,
            "adjclose": 12.81
        },
        "1379683800": {
            "date": "20-09-2013",
            "open": 13.18,
            "high": 13.18,
            "low": 12.91,
            "close": 13.01,
            "adjclose": 12.68
        },
        "1379943000": {
            "date": "23-09-2013",
            "open": 13.01,
            "high": 13.01,
            "low": 12.77,
            "close": 12.87,
            "adjclose": 12.55
        },
        "1380029400": {
            "date": "24-09-2013",
            "open": 12.87,
            "high": 12.91,
            "low": 12.48,
            "close": 12.62,
            "adjclose": 12.3
        },
        "1380115800": {
            "date": "25-09-2013",
            "open": 12.57,
            "high": 12.79,
            "low": 12.39,
            "close": 12.73,
            "adjclose": 12.41
        },
        "1380202200": {
            "date": "26-09-2013",
            "open": 12.74,
            "high": 12.74,
            "low": 12.59,
            "close": 12.64,
            "adjclose": 12.32
        },
        "1380288600": {
            "date": "27-09-2013",
            "open": 12.64,
            "high": 12.84,
            "low": 12.57,
            "close": 12.72,
            "adjclose": 12.4
        },
        "1380547800": {
            "date": "30-09-2013",
            "open": 12.69,
            "high": 12.7,
            "low": 12.51,
            "close": 12.53,
            "adjclose": 12.22
        },
        "1380634200": {
            "date": "01-10-2013",
            "open": 12.58,
            "high": 12.91,
            "low": 12.56,
            "close": 12.89,
            "adjclose": 12.56
        },
        "1380720600": {
            "date": "02-10-2013",
            "open": 12.83,
            "high": 12.89,
            "low": 12.75,
            "close": 12.83,
            "adjclose": 12.51
        },
        "1380807000": {
            "date": "03-10-2013",
            "open": 12.82,
            "high": 12.97,
            "low": 12.67,
            "close": 12.72,
            "adjclose": 12.4
        },
        "1380893400": {
            "date": "04-10-2013",
            "open": 12.74,
            "high": 12.8,
            "low": 12.65,
            "close": 12.75,
            "adjclose": 12.43
        },
        "1381152600": {
            "date": "07-10-2013",
            "open": 12.75,
            "high": 12.75,
            "low": 12.47,
            "close": 12.49,
            "adjclose": 12.17
        },
        "1381239000": {
            "date": "08-10-2013",
            "open": 12.63,
            "high": 12.63,
            "low": 12.14,
            "close": 12.17,
            "adjclose": 11.87
        },
        "1381325400": {
            "date": "09-10-2013",
            "open": 12.22,
            "high": 12.23,
            "low": 11.9,
            "close": 12.1,
            "adjclose": 11.8
        },
        "1381411800": {
            "date": "10-10-2013",
            "open": 12.31,
            "high": 12.39,
            "low": 12.19,
            "close": 12.23,
            "adjclose": 11.92
        },
        "1381498200": {
            "date": "11-10-2013",
            "open": 12.27,
            "high": 12.33,
            "low": 12.01,
            "close": 12.03,
            "adjclose": 11.72
        },
        "1381757400": {
            "date": "14-10-2013",
            "open": 12.04,
            "high": 12.04,
            "low": 11.85,
            "close": 12.01,
            "adjclose": 11.71
        },
        "1381843800": {
            "date": "15-10-2013",
            "open": 12.01,
            "high": 12.11,
            "low": 11.78,
            "close": 11.8,
            "adjclose": 11.51
        },
        "1381930200": {
            "date": "16-10-2013",
            "open": 11.9,
            "high": 11.93,
            "low": 11.66,
            "close": 11.72,
            "adjclose": 11.42
        },
        "1382016600": {
            "date": "17-10-2013",
            "open": 11.76,
            "high": 11.76,
            "low": 11.51,
            "close": 11.62,
            "adjclose": 11.32
        },
        "1382103000": {
            "date": "18-10-2013",
            "open": 11.66,
            "high": 11.92,
            "low": 11.64,
            "close": 11.86,
            "adjclose": 11.56
        },
        "1382362200": {
            "date": "21-10-2013",
            "open": 11.92,
            "high": 11.95,
            "low": 11.69,
            "close": 11.75,
            "adjclose": 11.45
        },
        "1382448600": {
            "date": "22-10-2013",
            "open": 11.78,
            "high": 11.93,
            "low": 11.69,
            "close": 11.89,
            "adjclose": 11.59
        },
        "1382535000": {
            "date": "23-10-2013",
            "open": 11.89,
            "high": 11.89,
            "low": 11.68,
            "close": 11.72,
            "adjclose": 11.42
        },
        "1382621400": {
            "date": "24-10-2013",
            "open": 11.75,
            "high": 12.32,
            "low": 11.75,
            "close": 12.18,
            "adjclose": 11.87
        },
        "1382707800": {
            "date": "25-10-2013",
            "open": 12.1,
            "high": 12.37,
            "low": 12.06,
            "close": 12.33,
            "adjclose": 12.02
        },
        "1382970600": {
            "date": "28-10-2013",
            "open": 12.36,
            "high": 12.36,
            "low": 12.14,
            "close": 12.2,
            "adjclose": 11.89
        },
        "1383057000": {
            "date": "29-10-2013",
            "open": 12.2,
            "high": 12.22,
            "low": 12.06,
            "close": 12.13,
            "adjclose": 11.82
        },
        "1383143400": {
            "date": "30-10-2013",
            "open": 12.13,
            "high": 12.18,
            "low": 11.68,
            "close": 11.75,
            "adjclose": 11.46
        },
        "1383229800": {
            "date": "31-10-2013",
            "open": 11.8,
            "high": 11.9,
            "low": 11.65,
            "close": 11.85,
            "adjclose": 11.55
        },
        "1383316200": {
            "date": "01-11-2013",
            "open": 11.86,
            "high": 12,
            "low": 11.58,
            "close": 11.75,
            "adjclose": 11.46
        },
        "1383575400": {
            "date": "04-11-2013",
            "open": 11.8,
            "high": 11.92,
            "low": 11.75,
            "close": 11.89,
            "adjclose": 11.59
        },
        "1383661800": {
            "date": "05-11-2013",
            "open": 11.87,
            "high": 11.89,
            "low": 11.5,
            "close": 11.54,
            "adjclose": 11.25
        },
        "1383748200": {
            "date": "06-11-2013",
            "open": 11.59,
            "high": 11.63,
            "low": 11.44,
            "close": 11.5,
            "adjclose": 11.21
        },
        "1383834600": {
            "date": "07-11-2013",
            "open": 11.52,
            "high": 11.64,
            "low": 11.41,
            "close": 11.45,
            "adjclose": 11.16
        },
        "1383921000": {
            "date": "08-11-2013",
            "open": 11.44,
            "high": 11.75,
            "low": 11.16,
            "close": 11.69,
            "adjclose": 11.4
        },
        "1384180200": {
            "date": "11-11-2013",
            "open": 11.65,
            "high": 11.79,
            "low": 11.61,
            "close": 11.75,
            "adjclose": 11.46
        },
        "1384266600": {
            "date": "12-11-2013",
            "open": 11.67,
            "high": 11.75,
            "low": 11.57,
            "close": 11.62,
            "adjclose": 11.32
        },
        "1384353000": {
            "date": "13-11-2013",
            "open": 11.62,
            "high": 11.78,
            "low": 11.49,
            "close": 11.78,
            "adjclose": 11.48
        },
        "1384439400": {
            "date": "14-11-2013",
            "open": 11.79,
            "high": 12.01,
            "low": 11.71,
            "close": 11.98,
            "adjclose": 11.68
        },
        "1384525800": {
            "date": "15-11-2013",
            "open": 12.01,
            "high": 12.18,
            "low": 11.93,
            "close": 12.07,
            "adjclose": 11.77
        },
        "1384871400": {
            "date": "19-11-2013",
            "open": 12.02,
            "high": 12.02,
            "low": 11.82,
            "close": 11.89,
            "adjclose": 11.59
        },
        "1384957800": {
            "date": "20-11-2013",
            "open": 11.91,
            "high": 12,
            "low": 11.82,
            "close": 11.91,
            "adjclose": 11.61
        },
        "1385044200": {
            "date": "21-11-2013",
            "open": 11.86,
            "high": 12.13,
            "low": 11.86,
            "close": 12.09,
            "adjclose": 11.78
        },
        "1385130600": {
            "date": "22-11-2013",
            "open": 11.96,
            "high": 12.16,
            "low": 11.78,
            "close": 11.84,
            "adjclose": 11.54
        },
        "1385389800": {
            "date": "25-11-2013",
            "open": 11.97,
            "high": 11.99,
            "low": 11.84,
            "close": 11.94,
            "adjclose": 11.64
        },
        "1385476200": {
            "date": "26-11-2013",
            "open": 11.97,
            "high": 12.22,
            "low": 11.94,
            "close": 12.17,
            "adjclose": 11.87
        },
        "1385562600": {
            "date": "27-11-2013",
            "open": 12.14,
            "high": 12.27,
            "low": 12.04,
            "close": 12.23,
            "adjclose": 11.92
        },
        "1385649000": {
            "date": "28-11-2013",
            "open": 12.22,
            "high": 12.35,
            "low": 12.17,
            "close": 12.28,
            "adjclose": 11.97
        },
        "1385735400": {
            "date": "29-11-2013",
            "open": 12.26,
            "high": 12.42,
            "low": 12.25,
            "close": 12.35,
            "adjclose": 12.04
        },
        "1385994600": {
            "date": "02-12-2013",
            "open": 12.35,
            "high": 12.46,
            "low": 12.26,
            "close": 12.36,
            "adjclose": 12.05
        },
        "1386081000": {
            "date": "03-12-2013",
            "open": 12.32,
            "high": 12.33,
            "low": 12.11,
            "close": 12.19,
            "adjclose": 11.88
        },
        "1386167400": {
            "date": "04-12-2013",
            "open": 12.19,
            "high": 12.49,
            "low": 12.1,
            "close": 12.45,
            "adjclose": 12.13
        },
        "1386253800": {
            "date": "05-12-2013",
            "open": 12.44,
            "high": 12.54,
            "low": 12.3,
            "close": 12.33,
            "adjclose": 12.02
        },
        "1386340200": {
            "date": "06-12-2013",
            "open": 12.44,
            "high": 12.84,
            "low": 12.36,
            "close": 12.73,
            "adjclose": 12.41
        },
        "1386599400": {
            "date": "09-12-2013",
            "open": 12.73,
            "high": 12.95,
            "low": 12.63,
            "close": 12.75,
            "adjclose": 12.42
        },
        "1386685800": {
            "date": "10-12-2013",
            "open": 12.74,
            "high": 12.91,
            "low": 12.69,
            "close": 12.81,
            "adjclose": 12.49
        },
        "1386772200": {
            "date": "11-12-2013",
            "open": 12.89,
            "high": 12.91,
            "low": 12.63,
            "close": 12.75,
            "adjclose": 12.42
        },
        "1386945000": {
            "date": "13-12-2013",
            "open": 12.78,
            "high": 12.91,
            "low": 12.58,
            "close": 12.64,
            "adjclose": 12.32
        },
        "1387204200": {
            "date": "16-12-2013",
            "open": 12.63,
            "high": 12.8,
            "low": 12.55,
            "close": 12.58,
            "adjclose": 12.27
        },
        "1387290600": {
            "date": "17-12-2013",
            "open": 12.64,
            "high": 12.64,
            "low": 12.49,
            "close": 12.6,
            "adjclose": 12.28
        },
        "1387377000": {
            "date": "18-12-2013",
            "open": 12.62,
            "high": 12.99,
            "low": 12.5,
            "close": 12.95,
            "adjclose": 12.62
        },
        "1387463400": {
            "date": "19-12-2013",
            "open": 12.95,
            "high": 12.95,
            "low": 12.61,
            "close": 12.79,
            "adjclose": 12.46
        },
        "1387549800": {
            "date": "20-12-2013",
            "open": 12.8,
            "high": 13.04,
            "low": 12.79,
            "close": 12.97,
            "adjclose": 12.64
        },
        "1387809000": {
            "date": "23-12-2013",
            "open": 12.98,
            "high": 13.02,
            "low": 12.86,
            "close": 12.96,
            "adjclose": 12.63
        },
        "1388068200": {
            "date": "26-12-2013",
            "open": 12.99,
            "high": 13.19,
            "low": 12.98,
            "close": 13.04,
            "adjclose": 12.71
        },
        "1388154600": {
            "date": "27-12-2013",
            "open": 13.03,
            "high": 13.16,
            "low": 12.9,
            "close": 13.12,
            "adjclose": 12.79
        },
        "1388413800": {
            "date": "30-12-2013",
            "open": 13.05,
            "high": 13.16,
            "low": 13.02,
            "close": 13.1,
            "adjclose": 12.77
        },
        "1388673000": {
            "date": "02-01-2014",
            "open": 13.09,
            "high": 13.11,
            "low": 12.83,
            "close": 12.92,
            "adjclose": 12.59
        },
        "1388759400": {
            "date": "03-01-2014",
            "open": 12.91,
            "high": 13.01,
            "low": 12.79,
            "close": 12.91,
            "adjclose": 12.58
        },
        "1389018600": {
            "date": "06-01-2014",
            "open": 12.93,
            "high": 13.06,
            "low": 12.87,
            "close": 12.97,
            "adjclose": 12.64
        },
        "1389105000": {
            "date": "07-01-2014",
            "open": 12.91,
            "high": 13.22,
            "low": 12.91,
            "close": 12.97,
            "adjclose": 12.64
        },
        "1389191400": {
            "date": "08-01-2014",
            "open": 12.96,
            "high": 13.28,
            "low": 12.92,
            "close": 13.15,
            "adjclose": 12.81
        },
        "1389277800": {
            "date": "09-01-2014",
            "open": 13.08,
            "high": 13.62,
            "low": 13.08,
            "close": 13.58,
            "adjclose": 13.24
        },
        "1389364200": {
            "date": "10-01-2014",
            "open": 13.58,
            "high": 14,
            "low": 13.53,
            "close": 13.92,
            "adjclose": 13.57
        },
        "1389623400": {
            "date": "13-01-2014",
            "open": 13.92,
            "high": 13.96,
            "low": 13.46,
            "close": 13.52,
            "adjclose": 13.18
        },
        "1389709800": {
            "date": "14-01-2014",
            "open": 13.53,
            "high": 13.98,
            "low": 13.53,
            "close": 13.96,
            "adjclose": 13.61
        },
        "1389796200": {
            "date": "15-01-2014",
            "open": 13.9,
            "high": 14.33,
            "low": 13.9,
            "close": 14.29,
            "adjclose": 13.93
        },
        "1389882600": {
            "date": "16-01-2014",
            "open": 14.34,
            "high": 14.68,
            "low": 14,
            "close": 14.07,
            "adjclose": 13.71
        },
        "1389969000": {
            "date": "17-01-2014",
            "open": 14.1,
            "high": 14.16,
            "low": 13.86,
            "close": 14.09,
            "adjclose": 13.73
        },
        "1390228200": {
            "date": "20-01-2014",
            "open": 14.18,
            "high": 14.27,
            "low": 14.1,
            "close": 14.18,
            "adjclose": 13.82
        },
        "1390314600": {
            "date": "21-01-2014",
            "open": 14.3,
            "high": 14.56,
            "low": 14.28,
            "close": 14.53,
            "adjclose": 14.16
        },
        "1390401000": {
            "date": "22-01-2014",
            "open": 14.57,
            "high": 14.94,
            "low": 14.52,
            "close": 14.69,
            "adjclose": 14.31
        },
        "1390487400": {
            "date": "23-01-2014",
            "open": 14.71,
            "high": 14.87,
            "low": 14.42,
            "close": 14.47,
            "adjclose": 14.11
        },
        "1390573800": {
            "date": "24-01-2014",
            "open": 14.53,
            "high": 14.53,
            "low": 14.04,
            "close": 14.24,
            "adjclose": 13.88
        },
        "1390833000": {
            "date": "27-01-2014",
            "open": 14.22,
            "high": 14.44,
            "low": 13.91,
            "close": 14.19,
            "adjclose": 13.83
        },
        "1390919400": {
            "date": "28-01-2014",
            "open": 14.23,
            "high": 14.57,
            "low": 14.22,
            "close": 14.3,
            "adjclose": 13.94
        },
        "1391005800": {
            "date": "29-01-2014",
            "open": 14.22,
            "high": 14.44,
            "low": 14.11,
            "close": 14.26,
            "adjclose": 13.9
        },
        "1391092200": {
            "date": "30-01-2014",
            "open": 14.36,
            "high": 14.51,
            "low": 14.16,
            "close": 14.23,
            "adjclose": 13.87
        },
        "1391178600": {
            "date": "31-01-2014",
            "open": 14.21,
            "high": 14.21,
            "low": 14.02,
            "close": 14.13,
            "adjclose": 13.77
        },
        "1391524200": {
            "date": "04-02-2014",
            "open": 13.98,
            "high": 14.09,
            "low": 13.79,
            "close": 14.07,
            "adjclose": 13.71
        },
        "1391610600": {
            "date": "05-02-2014",
            "open": 14.1,
            "high": 14.49,
            "low": 13.95,
            "close": 14.33,
            "adjclose": 13.96
        },
        "1391697000": {
            "date": "06-02-2014",
            "open": 14.32,
            "high": 14.73,
            "low": 14.15,
            "close": 14.62,
            "adjclose": 14.25
        },
        "1391783400": {
            "date": "07-02-2014",
            "open": 14.66,
            "high": 14.93,
            "low": 14.33,
            "close": 14.61,
            "adjclose": 14.24
        },
        "1392042600": {
            "date": "10-02-2014",
            "open": 14.45,
            "high": 14.54,
            "low": 14.33,
            "close": 14.39,
            "adjclose": 14.02
        },
        "1392129000": {
            "date": "11-02-2014",
            "open": 14.48,
            "high": 14.65,
            "low": 14.36,
            "close": 14.58,
            "adjclose": 14.21
        },
        "1392215400": {
            "date": "12-02-2014",
            "open": 14.62,
            "high": 14.74,
            "low": 14.52,
            "close": 14.69,
            "adjclose": 14.31
        },
        "1392301800": {
            "date": "13-02-2014",
            "open": 14.61,
            "high": 14.83,
            "low": 14.51,
            "close": 14.63,
            "adjclose": 14.26
        },
        "1392388200": {
            "date": "14-02-2014",
            "open": 14.58,
            "high": 14.85,
            "low": 14.58,
            "close": 14.78,
            "adjclose": 14.41
        },
        "1392647400": {
            "date": "17-02-2014",
            "open": 14.77,
            "high": 14.83,
            "low": 14.72,
            "close": 14.78,
            "adjclose": 14.41
        },
        "1392733800": {
            "date": "18-02-2014",
            "open": 14.79,
            "high": 15.12,
            "low": 14.71,
            "close": 15.01,
            "adjclose": 14.63
        },
        "1392820200": {
            "date": "19-02-2014",
            "open": 14.87,
            "high": 15.36,
            "low": 14.86,
            "close": 15.17,
            "adjclose": 14.79
        },
        "1392906600": {
            "date": "20-02-2014",
            "open": 15.16,
            "high": 15.28,
            "low": 14.97,
            "close": 15.23,
            "adjclose": 14.85
        },
        "1392993000": {
            "date": "21-02-2014",
            "open": 15.32,
            "high": 15.34,
            "low": 15,
            "close": 15.03,
            "adjclose": 14.65
        },
        "1393252200": {
            "date": "24-02-2014",
            "open": 15.1,
            "high": 15.11,
            "low": 14.94,
            "close": 15.04,
            "adjclose": 14.66
        },
        "1393338600": {
            "date": "25-02-2014",
            "open": 15.04,
            "high": 15.08,
            "low": 14.61,
            "close": 14.65,
            "adjclose": 14.28
        },
        "1393425000": {
            "date": "26-02-2014",
            "open": 14.87,
            "high": 15.15,
            "low": 14.78,
            "close": 14.92,
            "adjclose": 14.54
        },
        "1393511400": {
            "date": "27-02-2014",
            "open": 15.01,
            "high": 15.2,
            "low": 14.88,
            "close": 14.96,
            "adjclose": 14.58
        },
        "1393597800": {
            "date": "28-02-2014",
            "open": 15.17,
            "high": 15.17,
            "low": 14.73,
            "close": 14.82,
            "adjclose": 14.45
        },
        "1393857000": {
            "date": "03-03-2014",
            "open": 14.74,
            "high": 14.79,
            "low": 14.34,
            "close": 14.43,
            "adjclose": 14.06
        },
        "1393943400": {
            "date": "04-03-2014",
            "open": 14.65,
            "high": 14.78,
            "low": 14.55,
            "close": 14.75,
            "adjclose": 14.37
        },
        "1394029800": {
            "date": "05-03-2014",
            "open": 14.81,
            "high": 14.81,
            "low": 14.45,
            "close": 14.66,
            "adjclose": 14.29
        },
        "1394116200": {
            "date": "06-03-2014",
            "open": 14.69,
            "high": 14.81,
            "low": 14.62,
            "close": 14.65,
            "adjclose": 14.28
        },
        "1394202600": {
            "date": "07-03-2014",
            "open": 14.65,
            "high": 14.78,
            "low": 14.45,
            "close": 14.61,
            "adjclose": 14.24
        },
        "1394461800": {
            "date": "10-03-2014",
            "open": 14.52,
            "high": 14.65,
            "low": 14.28,
            "close": 14.42,
            "adjclose": 14.06
        },
        "1394548200": {
            "date": "11-03-2014",
            "open": 14.42,
            "high": 14.42,
            "low": 14.19,
            "close": 14.32,
            "adjclose": 13.96
        },
        "1394634600": {
            "date": "12-03-2014",
            "open": 14.39,
            "high": 14.39,
            "low": 14.1,
            "close": 14.22,
            "adjclose": 13.86
        },
        "1394721000": {
            "date": "13-03-2014",
            "open": 14.22,
            "high": 14.27,
            "low": 13.97,
            "close": 14.04,
            "adjclose": 13.69
        },
        "1394807400": {
            "date": "14-03-2014",
            "open": 13.94,
            "high": 14.04,
            "low": 13.55,
            "close": 13.63,
            "adjclose": 13.29
        },
        "1395153000": {
            "date": "18-03-2014",
            "open": 13.67,
            "high": 14.1,
            "low": 13.67,
            "close": 14.06,
            "adjclose": 13.71
        },
        "1395239400": {
            "date": "19-03-2014",
            "open": 14.32,
            "high": 14.34,
            "low": 13.94,
            "close": 14,
            "adjclose": 13.65
        },
        "1395325800": {
            "date": "20-03-2014",
            "open": 14.14,
            "high": 14.4,
            "low": 13.97,
            "close": 14.25,
            "adjclose": 13.89
        },
        "1395412200": {
            "date": "21-03-2014",
            "open": 14.19,
            "high": 14.71,
            "low": 14.19,
            "close": 14.64,
            "adjclose": 14.27
        },
        "1395671400": {
            "date": "24-03-2014",
            "open": 14.64,
            "high": 14.71,
            "low": 14.44,
            "close": 14.47,
            "adjclose": 14.11
        },
        "1395757800": {
            "date": "25-03-2014",
            "open": 14.53,
            "high": 14.74,
            "low": 14.53,
            "close": 14.61,
            "adjclose": 14.24
        },
        "1395844200": {
            "date": "26-03-2014",
            "open": 14.62,
            "high": 14.86,
            "low": 14.35,
            "close": 14.39,
            "adjclose": 14.02
        },
        "1395930600": {
            "date": "27-03-2014",
            "open": 14.32,
            "high": 14.59,
            "low": 14.16,
            "close": 14.33,
            "adjclose": 13.96
        },
        "1396017000": {
            "date": "28-03-2014",
            "open": 14.34,
            "high": 14.48,
            "low": 14.06,
            "close": 14.1,
            "adjclose": 13.74
        },
        "1396276200": {
            "date": "31-03-2014",
            "open": 14.16,
            "high": 14.26,
            "low": 14.02,
            "close": 14.1,
            "adjclose": 13.75
        },
        "1396362600": {
            "date": "01-04-2014",
            "open": 14.12,
            "high": 14.22,
            "low": 14.03,
            "close": 14.16,
            "adjclose": 13.8
        },
        "1396449000": {
            "date": "02-04-2014",
            "open": 14.21,
            "high": 14.63,
            "low": 14.18,
            "close": 14.61,
            "adjclose": 14.24
        },
        "1396535400": {
            "date": "03-04-2014",
            "open": 14.62,
            "high": 14.96,
            "low": 14.51,
            "close": 14.57,
            "adjclose": 14.21
        },
        "1396621800": {
            "date": "04-04-2014",
            "open": 14.57,
            "high": 15.81,
            "low": 14.51,
            "close": 15.07,
            "adjclose": 14.69
        },
        "1396877400": {
            "date": "07-04-2014",
            "open": 14.87,
            "high": 15.1,
            "low": 14.56,
            "close": 14.72,
            "adjclose": 14.35
        },
        "1396963800": {
            "date": "08-04-2014",
            "open": 14.72,
            "high": 14.82,
            "low": 14.49,
            "close": 14.78,
            "adjclose": 14.41
        },
        "1397050200": {
            "date": "09-04-2014",
            "open": 14.81,
            "high": 14.91,
            "low": 14.63,
            "close": 14.75,
            "adjclose": 14.37
        },
        "1397136600": {
            "date": "10-04-2014",
            "open": 14.75,
            "high": 14.92,
            "low": 14.4,
            "close": 14.52,
            "adjclose": 14.16
        },
        "1397223000": {
            "date": "11-04-2014",
            "open": 14.51,
            "high": 14.53,
            "low": 14.28,
            "close": 14.35,
            "adjclose": 13.99
        },
        "1397482200": {
            "date": "14-04-2014",
            "open": 14.41,
            "high": 14.58,
            "low": 14.22,
            "close": 14.3,
            "adjclose": 13.94
        },
        "1397568600": {
            "date": "15-04-2014",
            "open": 14.3,
            "high": 14.51,
            "low": 14.16,
            "close": 14.24,
            "adjclose": 13.88
        },
        "1397655000": {
            "date": "16-04-2014",
            "open": 14.34,
            "high": 14.6,
            "low": 14.16,
            "close": 14.57,
            "adjclose": 14.2
        },
        "1398087000": {
            "date": "21-04-2014",
            "open": 14.57,
            "high": 14.6,
            "low": 14.36,
            "close": 14.53,
            "adjclose": 14.16
        },
        "1398173400": {
            "date": "22-04-2014",
            "open": 14.58,
            "high": 14.87,
            "low": 14.41,
            "close": 14.44,
            "adjclose": 14.07
        },
        "1398259800": {
            "date": "23-04-2014",
            "open": 14.46,
            "high": 14.62,
            "low": 14.31,
            "close": 14.58,
            "adjclose": 14.21
        },
        "1398346200": {
            "date": "24-04-2014",
            "open": 14.51,
            "high": 14.62,
            "low": 14.39,
            "close": 14.46,
            "adjclose": 14.09
        },
        "1398432600": {
            "date": "25-04-2014",
            "open": 14.49,
            "high": 14.55,
            "low": 14.3,
            "close": 14.5,
            "adjclose": 14.13
        },
        "1398691800": {
            "date": "28-04-2014",
            "open": 14.51,
            "high": 14.56,
            "low": 14.16,
            "close": 14.24,
            "adjclose": 13.88
        },
        "1398778200": {
            "date": "29-04-2014",
            "open": 14.27,
            "high": 14.68,
            "low": 14.27,
            "close": 14.57,
            "adjclose": 14.2
        },
        "1398864600": {
            "date": "30-04-2014",
            "open": 14.57,
            "high": 15.01,
            "low": 14.57,
            "close": 14.87,
            "adjclose": 14.5
        },
        "1399037400": {
            "date": "02-05-2014",
            "open": 15.01,
            "high": 15.11,
            "low": 14.88,
            "close": 15.01,
            "adjclose": 14.63
        },
        "1399296600": {
            "date": "05-05-2014",
            "open": 15.01,
            "high": 15.02,
            "low": 14.76,
            "close": 15,
            "adjclose": 14.62
        },
        "1399383000": {
            "date": "06-05-2014",
            "open": 14.99,
            "high": 15,
            "low": 14.8,
            "close": 14.89,
            "adjclose": 14.51
        },
        "1399469400": {
            "date": "07-05-2014",
            "open": 14.94,
            "high": 14.97,
            "low": 14.82,
            "close": 14.93,
            "adjclose": 14.55
        },
        "1399555800": {
            "date": "08-05-2014",
            "open": 14.97,
            "high": 15.08,
            "low": 14.84,
            "close": 14.93,
            "adjclose": 14.55
        },
        "1399642200": {
            "date": "09-05-2014",
            "open": 14.91,
            "high": 14.93,
            "low": 14.44,
            "close": 14.46,
            "adjclose": 14.1
        },
        "1399901400": {
            "date": "12-05-2014",
            "open": 14.53,
            "high": 14.72,
            "low": 14.53,
            "close": 14.67,
            "adjclose": 14.3
        },
        "1399987800": {
            "date": "13-05-2014",
            "open": 14.22,
            "high": 14.79,
            "low": 14.22,
            "close": 14.75,
            "adjclose": 14.38
        },
        "1400074200": {
            "date": "14-05-2014",
            "open": 14.74,
            "high": 14.74,
            "low": 14.4,
            "close": 14.46,
            "adjclose": 14.09
        },
        "1400160600": {
            "date": "15-05-2014",
            "open": 14.46,
            "high": 14.52,
            "low": 14.24,
            "close": 14.31,
            "adjclose": 13.95
        },
        "1400247000": {
            "date": "16-05-2014",
            "open": 14.37,
            "high": 14.67,
            "low": 14.33,
            "close": 14.46,
            "adjclose": 14.09
        },
        "1400506200": {
            "date": "19-05-2014",
            "open": 14.48,
            "high": 14.48,
            "low": 14.22,
            "close": 14.38,
            "adjclose": 14.02
        },
        "1400592600": {
            "date": "20-05-2014",
            "open": 14.46,
            "high": 14.46,
            "low": 14.27,
            "close": 14.31,
            "adjclose": 13.95
        },
        "1400679000": {
            "date": "21-05-2014",
            "open": 14.39,
            "high": 14.52,
            "low": 14.35,
            "close": 14.44,
            "adjclose": 14.07
        },
        "1400765400": {
            "date": "22-05-2014",
            "open": 14.44,
            "high": 14.61,
            "low": 14.38,
            "close": 14.54,
            "adjclose": 14.17
        },
        "1400851800": {
            "date": "23-05-2014",
            "open": 14.52,
            "high": 14.71,
            "low": 14.49,
            "close": 14.66,
            "adjclose": 14.29
        },
        "1401111000": {
            "date": "26-05-2014",
            "open": 14.72,
            "high": 14.8,
            "low": 14.71,
            "close": 14.76,
            "adjclose": 14.38
        },
        "1401197400": {
            "date": "27-05-2014",
            "open": 14.82,
            "high": 14.93,
            "low": 14.79,
            "close": 14.82,
            "adjclose": 14.45
        },
        "1401283800": {
            "date": "28-05-2014",
            "open": 14.86,
            "high": 14.98,
            "low": 14.81,
            "close": 14.94,
            "adjclose": 14.57
        },
        "1401370200": {
            "date": "29-05-2014",
            "open": 14.85,
            "high": 15.02,
            "low": 14.82,
            "close": 14.91,
            "adjclose": 14.53
        },
        "1401456600": {
            "date": "30-05-2014",
            "open": 14.91,
            "high": 14.95,
            "low": 14.68,
            "close": 14.72,
            "adjclose": 14.35
        },
        "1401715800": {
            "date": "02-06-2014",
            "open": 14.8,
            "high": 14.92,
            "low": 14.62,
            "close": 14.86,
            "adjclose": 14.48
        },
        "1401802200": {
            "date": "03-06-2014",
            "open": 14.78,
            "high": 14.9,
            "low": 14.75,
            "close": 14.88,
            "adjclose": 14.51
        },
        "1401888600": {
            "date": "04-06-2014",
            "open": 14.84,
            "high": 14.88,
            "low": 14.76,
            "close": 14.78,
            "adjclose": 14.41
        },
        "1401975000": {
            "date": "05-06-2014",
            "open": 14.8,
            "high": 14.98,
            "low": 14.77,
            "close": 14.78,
            "adjclose": 14.41
        },
        "1402061400": {
            "date": "06-06-2014",
            "open": 14.78,
            "high": 15.11,
            "low": 14.78,
            "close": 15.01,
            "adjclose": 14.63
        },
        "1402320600": {
            "date": "09-06-2014",
            "open": 15.06,
            "high": 15.34,
            "low": 14.96,
            "close": 15.17,
            "adjclose": 14.78
        },
        "1402407000": {
            "date": "10-06-2014",
            "open": 15.17,
            "high": 15.71,
            "low": 15.11,
            "close": 15.66,
            "adjclose": 15.27
        },
        "1402493400": {
            "date": "11-06-2014",
            "open": 15.65,
            "high": 15.65,
            "low": 15.36,
            "close": 15.48,
            "adjclose": 15.09
        },
        "1402579800": {
            "date": "12-06-2014",
            "open": 15.47,
            "high": 15.55,
            "low": 15.21,
            "close": 15.24,
            "adjclose": 14.85
        },
        "1402666200": {
            "date": "13-06-2014",
            "open": 15.27,
            "high": 15.42,
            "low": 15.17,
            "close": 15.19,
            "adjclose": 14.81
        },
        "1402925400": {
            "date": "16-06-2014",
            "open": 15.19,
            "high": 15.29,
            "low": 15.11,
            "close": 15.25,
            "adjclose": 14.86
        },
        "1403011800": {
            "date": "17-06-2014",
            "open": 15.26,
            "high": 15.31,
            "low": 15.16,
            "close": 15.24,
            "adjclose": 14.85
        },
        "1403098200": {
            "date": "18-06-2014",
            "open": 15.26,
            "high": 15.44,
            "low": 15.18,
            "close": 15.38,
            "adjclose": 14.99
        },
        "1403184600": {
            "date": "19-06-2014",
            "open": 15.38,
            "high": 15.58,
            "low": 15.34,
            "close": 15.56,
            "adjclose": 15.16
        },
        "1403271000": {
            "date": "20-06-2014",
            "open": 15.52,
            "high": 15.65,
            "low": 15.39,
            "close": 15.42,
            "adjclose": 15.03
        },
        "1403530200": {
            "date": "23-06-2014",
            "open": 15.36,
            "high": 15.47,
            "low": 15.35,
            "close": 15.38,
            "adjclose": 14.99
        },
        "1403616600": {
            "date": "24-06-2014",
            "open": 15.38,
            "high": 15.45,
            "low": 15.21,
            "close": 15.28,
            "adjclose": 14.9
        },
        "1403703000": {
            "date": "25-06-2014",
            "open": 15.29,
            "high": 15.34,
            "low": 15.17,
            "close": 15.21,
            "adjclose": 14.83
        },
        "1403789400": {
            "date": "26-06-2014",
            "open": 15.19,
            "high": 15.45,
            "low": 15.18,
            "close": 15.29,
            "adjclose": 14.9
        },
        "1403875800": {
            "date": "27-06-2014",
            "open": 15.26,
            "high": 15.33,
            "low": 15.18,
            "close": 15.21,
            "adjclose": 14.83
        },
        "1404135000": {
            "date": "30-06-2014",
            "open": 15.29,
            "high": 15.39,
            "low": 15.18,
            "close": 15.27,
            "adjclose": 14.89
        },
        "1404221400": {
            "date": "01-07-2014",
            "open": 15.34,
            "high": 15.49,
            "low": 15.34,
            "close": 15.45,
            "adjclose": 15.06
        },
        "1404307800": {
            "date": "02-07-2014",
            "open": 15.42,
            "high": 15.65,
            "low": 15.42,
            "close": 15.62,
            "adjclose": 15.23
        },
        "1404394200": {
            "date": "03-07-2014",
            "open": 15.65,
            "high": 15.76,
            "low": 15.51,
            "close": 15.71,
            "adjclose": 15.31
        },
        "1404480600": {
            "date": "04-07-2014",
            "open": 15.71,
            "high": 15.78,
            "low": 15.62,
            "close": 15.72,
            "adjclose": 15.32
        },
        "1404739800": {
            "date": "07-07-2014",
            "open": 15.75,
            "high": 15.75,
            "low": 15.56,
            "close": 15.59,
            "adjclose": 15.2
        },
        "1404826200": {
            "date": "08-07-2014",
            "open": 15.56,
            "high": 15.62,
            "low": 15.26,
            "close": 15.47,
            "adjclose": 15.08
        },
        "1404912600": {
            "date": "09-07-2014",
            "open": 15.42,
            "high": 15.53,
            "low": 15.33,
            "close": 15.45,
            "adjclose": 15.06
        },
        "1404999000": {
            "date": "10-07-2014",
            "open": 15.37,
            "high": 15.45,
            "low": 15.26,
            "close": 15.42,
            "adjclose": 15.03
        },
        "1405085400": {
            "date": "11-07-2014",
            "open": 15.35,
            "high": 15.42,
            "low": 15.2,
            "close": 15.26,
            "adjclose": 14.87
        },
        "1405344600": {
            "date": "14-07-2014",
            "open": 15.34,
            "high": 15.45,
            "low": 15.23,
            "close": 15.42,
            "adjclose": 15.03
        },
        "1405431000": {
            "date": "15-07-2014",
            "open": 15.44,
            "high": 15.45,
            "low": 15.19,
            "close": 15.25,
            "adjclose": 14.86
        },
        "1405517400": {
            "date": "16-07-2014",
            "open": 15.33,
            "high": 15.33,
            "low": 15.2,
            "close": 15.25,
            "adjclose": 14.86
        },
        "1405603800": {
            "date": "17-07-2014",
            "open": 15.25,
            "high": 15.25,
            "low": 14.88,
            "close": 14.96,
            "adjclose": 14.58
        },
        "1405690200": {
            "date": "18-07-2014",
            "open": 14.85,
            "high": 15.32,
            "low": 14.58,
            "close": 15.26,
            "adjclose": 14.88
        },
        "1405949400": {
            "date": "21-07-2014",
            "open": 15.26,
            "high": 15.26,
            "low": 14.97,
            "close": 15.07,
            "adjclose": 14.69
        },
        "1406035800": {
            "date": "22-07-2014",
            "open": 15.11,
            "high": 15.2,
            "low": 14.99,
            "close": 15.07,
            "adjclose": 14.69
        },
        "1406122200": {
            "date": "23-07-2014",
            "open": 15.14,
            "high": 15.14,
            "low": 15.02,
            "close": 15.03,
            "adjclose": 14.65
        },
        "1406208600": {
            "date": "24-07-2014",
            "open": 15.15,
            "high": 15.15,
            "low": 14.9,
            "close": 14.97,
            "adjclose": 14.59
        },
        "1406295000": {
            "date": "25-07-2014",
            "open": 15.07,
            "high": 15.07,
            "low": 14.89,
            "close": 14.96,
            "adjclose": 14.58
        },
        "1406554200": {
            "date": "28-07-2014",
            "open": 15.02,
            "high": 15.02,
            "low": 14.78,
            "close": 14.8,
            "adjclose": 14.43
        },
        "1406640600": {
            "date": "29-07-2014",
            "open": 14.85,
            "high": 14.97,
            "low": 14.78,
            "close": 14.79,
            "adjclose": 14.42
        },
        "1406727000": {
            "date": "30-07-2014",
            "open": 14.85,
            "high": 14.97,
            "low": 14.78,
            "close": 14.86,
            "adjclose": 14.48
        },
        "1406813400": {
            "date": "31-07-2014",
            "open": 14.84,
            "high": 14.87,
            "low": 14.68,
            "close": 14.74,
            "adjclose": 14.37
        },
        "1406899800": {
            "date": "01-08-2014",
            "open": 14.85,
            "high": 14.86,
            "low": 14.61,
            "close": 14.63,
            "adjclose": 14.26
        },
        "1407159000": {
            "date": "04-08-2014",
            "open": 14.68,
            "high": 14.93,
            "low": 14.65,
            "close": 14.73,
            "adjclose": 14.36
        },
        "1407245400": {
            "date": "05-08-2014",
            "open": 14.79,
            "high": 14.85,
            "low": 14.67,
            "close": 14.76,
            "adjclose": 14.38
        },
        "1407331800": {
            "date": "06-08-2014",
            "open": 14.75,
            "high": 14.81,
            "low": 14.64,
            "close": 14.77,
            "adjclose": 14.39
        },
        "1407418200": {
            "date": "07-08-2014",
            "open": 14.77,
            "high": 14.96,
            "low": 14.64,
            "close": 14.7,
            "adjclose": 14.33
        },
        "1407504600": {
            "date": "08-08-2014",
            "open": 14.76,
            "high": 15.03,
            "low": 14.69,
            "close": 14.94,
            "adjclose": 14.57
        },
        "1407763800": {
            "date": "11-08-2014",
            "open": 15.04,
            "high": 15.1,
            "low": 14.94,
            "close": 14.94,
            "adjclose": 14.57
        },
        "1407850200": {
            "date": "12-08-2014",
            "open": 14.92,
            "high": 15,
            "low": 14.84,
            "close": 14.88,
            "adjclose": 14.51
        },
        "1407936600": {
            "date": "13-08-2014",
            "open": 14.88,
            "high": 15.06,
            "low": 14.87,
            "close": 14.92,
            "adjclose": 14.54
        },
        "1408023000": {
            "date": "14-08-2014",
            "open": 14.96,
            "high": 15.02,
            "low": 14.87,
            "close": 14.99,
            "adjclose": 14.61
        },
        "1408109400": {
            "date": "15-08-2014",
            "open": 15.02,
            "high": 15.02,
            "low": 14.79,
            "close": 14.91,
            "adjclose": 14.53
        },
        "1408368600": {
            "date": "18-08-2014",
            "open": 15,
            "high": 15.01,
            "low": 14.88,
            "close": 14.97,
            "adjclose": 14.59
        },
        "1408455000": {
            "date": "19-08-2014",
            "open": 15.02,
            "high": 15.04,
            "low": 14.91,
            "close": 15,
            "adjclose": 14.62
        },
        "1408541400": {
            "date": "20-08-2014",
            "open": 14.94,
            "high": 15.1,
            "low": 14.94,
            "close": 15.09,
            "adjclose": 14.71
        },
        "1408627800": {
            "date": "21-08-2014",
            "open": 15.06,
            "high": 15.16,
            "low": 15.02,
            "close": 15.05,
            "adjclose": 14.67
        },
        "1408714200": {
            "date": "22-08-2014",
            "open": 15.09,
            "high": 15.11,
            "low": 14.98,
            "close": 15.08,
            "adjclose": 14.7
        },
        "1408973400": {
            "date": "25-08-2014",
            "open": 15.11,
            "high": 15.34,
            "low": 15.09,
            "close": 15.31,
            "adjclose": 14.92
        },
        "1409059800": {
            "date": "26-08-2014",
            "open": 15.34,
            "high": 15.5,
            "low": 15.27,
            "close": 15.39,
            "adjclose": 15
        },
        "1409146200": {
            "date": "27-08-2014",
            "open": 15.38,
            "high": 15.5,
            "low": 15.3,
            "close": 15.34,
            "adjclose": 14.95
        },
        "1409232600": {
            "date": "28-08-2014",
            "open": 15.34,
            "high": 15.42,
            "low": 15.25,
            "close": 15.36,
            "adjclose": 14.97
        },
        "1409319000": {
            "date": "29-08-2014",
            "open": 15.27,
            "high": 15.48,
            "low": 15.27,
            "close": 15.44,
            "adjclose": 15.05
        },
        "1409578200": {
            "date": "01-09-2014",
            "open": 15.44,
            "high": 15.44,
            "low": 15.29,
            "close": 15.37,
            "adjclose": 14.98
        },
        "1409664600": {
            "date": "02-09-2014",
            "open": 15.37,
            "high": 15.63,
            "low": 15.34,
            "close": 15.52,
            "adjclose": 15.13
        },
        "1409751000": {
            "date": "03-09-2014",
            "open": 15.57,
            "high": 15.6,
            "low": 15.48,
            "close": 15.51,
            "adjclose": 15.12
        },
        "1409837400": {
            "date": "04-09-2014",
            "open": 15.56,
            "high": 15.69,
            "low": 15.5,
            "close": 15.65,
            "adjclose": 15.25
        },
        "1409923800": {
            "date": "05-09-2014",
            "open": 15.6,
            "high": 15.63,
            "low": 15.51,
            "close": 15.53,
            "adjclose": 15.14
        },
        "1410183000": {
            "date": "08-09-2014",
            "open": 15.53,
            "high": 15.64,
            "low": 15.46,
            "close": 15.64,
            "adjclose": 15.24
        },
        "1410269400": {
            "date": "09-09-2014",
            "open": 15.64,
            "high": 15.73,
            "low": 15.55,
            "close": 15.58,
            "adjclose": 15.18
        },
        "1410355800": {
            "date": "10-09-2014",
            "open": 15.68,
            "high": 15.69,
            "low": 15.51,
            "close": 15.65,
            "adjclose": 15.25
        },
        "1410442200": {
            "date": "11-09-2014",
            "open": 15.54,
            "high": 15.73,
            "low": 15.53,
            "close": 15.66,
            "adjclose": 15.27
        },
        "1410528600": {
            "date": "12-09-2014",
            "open": 15.67,
            "high": 15.68,
            "low": 15.5,
            "close": 15.62,
            "adjclose": 15.23
        },
        "1410787800": {
            "date": "15-09-2014",
            "open": 15.62,
            "high": 15.62,
            "low": 15.47,
            "close": 15.5,
            "adjclose": 15.11
        },
        "1410960600": {
            "date": "17-09-2014",
            "open": 15.5,
            "high": 15.65,
            "low": 15.49,
            "close": 15.63,
            "adjclose": 15.23
        },
        "1411047000": {
            "date": "18-09-2014",
            "open": 15.65,
            "high": 15.69,
            "low": 15.54,
            "close": 15.63,
            "adjclose": 15.23
        },
        "1411133400": {
            "date": "19-09-2014",
            "open": 15.63,
            "high": 15.68,
            "low": 15.47,
            "close": 15.6,
            "adjclose": 15.21
        },
        "1411392600": {
            "date": "22-09-2014",
            "open": 15.65,
            "high": 15.65,
            "low": 15.51,
            "close": 15.61,
            "adjclose": 15.22
        },
        "1411479000": {
            "date": "23-09-2014",
            "open": 15.62,
            "high": 15.64,
            "low": 15.44,
            "close": 15.6,
            "adjclose": 15.21
        },
        "1411565400": {
            "date": "24-09-2014",
            "open": 15.62,
            "high": 15.73,
            "low": 15.53,
            "close": 15.66,
            "adjclose": 15.27
        },
        "1411651800": {
            "date": "25-09-2014",
            "open": 15.59,
            "high": 15.7,
            "low": 15.56,
            "close": 15.61,
            "adjclose": 15.22
        },
        "1411738200": {
            "date": "26-09-2014",
            "open": 15.53,
            "high": 15.69,
            "low": 15.53,
            "close": 15.64,
            "adjclose": 15.24
        },
        "1411997400": {
            "date": "29-09-2014",
            "open": 15.56,
            "high": 15.67,
            "low": 15.5,
            "close": 15.63,
            "adjclose": 15.23
        },
        "1412083800": {
            "date": "30-09-2014",
            "open": 15.69,
            "high": 15.74,
            "low": 15.5,
            "close": 15.56,
            "adjclose": 15.16
        },
        "1412170200": {
            "date": "01-10-2014",
            "open": 15.6,
            "high": 15.6,
            "low": 15.18,
            "close": 15.26,
            "adjclose": 14.87
        },
        "1412256600": {
            "date": "02-10-2014",
            "open": 15.26,
            "high": 15.26,
            "low": 14.86,
            "close": 15.02,
            "adjclose": 14.64
        },
        "1412343000": {
            "date": "03-10-2014",
            "open": 15.04,
            "high": 15.23,
            "low": 14.98,
            "close": 15.16,
            "adjclose": 14.77
        },
        "1412602200": {
            "date": "06-10-2014",
            "open": 15.26,
            "high": 15.39,
            "low": 15.11,
            "close": 15.18,
            "adjclose": 14.8
        },
        "1412688600": {
            "date": "07-10-2014",
            "open": 15.18,
            "high": 15.18,
            "low": 15,
            "close": 15.04,
            "adjclose": 14.66
        },
        "1412775000": {
            "date": "08-10-2014",
            "open": 14.98,
            "high": 15.04,
            "low": 14.69,
            "close": 14.9,
            "adjclose": 14.52
        },
        "1412861400": {
            "date": "09-10-2014",
            "open": 14.96,
            "high": 14.96,
            "low": 14.45,
            "close": 14.53,
            "adjclose": 14.16
        },
        "1412947800": {
            "date": "10-10-2014",
            "open": 14.54,
            "high": 14.56,
            "low": 13.97,
            "close": 14.02,
            "adjclose": 13.67
        },
        "1413207000": {
            "date": "13-10-2014",
            "open": 14.09,
            "high": 14.19,
            "low": 13.41,
            "close": 13.46,
            "adjclose": 13.12
        },
        "1413293400": {
            "date": "14-10-2014",
            "open": 13.51,
            "high": 13.68,
            "low": 13.22,
            "close": 13.58,
            "adjclose": 13.24
        },
        "1413379800": {
            "date": "15-10-2014",
            "open": 13.46,
            "high": 13.56,
            "low": 13.1,
            "close": 13.5,
            "adjclose": 13.16
        },
        "1413466200": {
            "date": "16-10-2014",
            "open": 13.31,
            "high": 13.76,
            "low": 13.25,
            "close": 13.68,
            "adjclose": 13.34
        },
        "1413552600": {
            "date": "17-10-2014",
            "open": 13.77,
            "high": 14.15,
            "low": 13.77,
            "close": 14.01,
            "adjclose": 13.66
        },
        "1413811800": {
            "date": "20-10-2014",
            "open": 13.9,
            "high": 14.15,
            "low": 13.9,
            "close": 14.11,
            "adjclose": 13.75
        },
        "1413898200": {
            "date": "21-10-2014",
            "open": 14.15,
            "high": 14.36,
            "low": 14.14,
            "close": 14.27,
            "adjclose": 13.91
        },
        "1413984600": {
            "date": "22-10-2014",
            "open": 14.31,
            "high": 14.41,
            "low": 13.94,
            "close": 13.98,
            "adjclose": 13.62
        },
        "1414071000": {
            "date": "23-10-2014",
            "open": 14,
            "high": 14.54,
            "low": 13.91,
            "close": 14.42,
            "adjclose": 14.06
        },
        "1414157400": {
            "date": "24-10-2014",
            "open": 14.42,
            "high": 14.67,
            "low": 14.28,
            "close": 14.56,
            "adjclose": 14.19
        },
        "1414420200": {
            "date": "27-10-2014",
            "open": 14.46,
            "high": 14.5,
            "low": 14.29,
            "close": 14.41,
            "adjclose": 14.05
        },
        "1414506600": {
            "date": "28-10-2014",
            "open": 14.41,
            "high": 14.82,
            "low": 14.41,
            "close": 14.65,
            "adjclose": 14.28
        },
        "1414593000": {
            "date": "29-10-2014",
            "open": 14.6,
            "high": 14.74,
            "low": 14.4,
            "close": 14.54,
            "adjclose": 14.17
        },
        "1414679400": {
            "date": "30-10-2014",
            "open": 14.54,
            "high": 14.7,
            "low": 14.4,
            "close": 14.54,
            "adjclose": 14.18
        },
        "1414765800": {
            "date": "31-10-2014",
            "open": 14.62,
            "high": 14.89,
            "low": 14.62,
            "close": 14.75,
            "adjclose": 14.38
        },
        "1415025000": {
            "date": "03-11-2014",
            "open": 14.69,
            "high": 14.93,
            "low": 14.68,
            "close": 14.87,
            "adjclose": 14.5
        },
        "1415111400": {
            "date": "04-11-2014",
            "open": 14.8,
            "high": 14.88,
            "low": 14.68,
            "close": 14.78,
            "adjclose": 14.41
        },
        "1415197800": {
            "date": "05-11-2014",
            "open": 14.81,
            "high": 14.99,
            "low": 14.71,
            "close": 14.77,
            "adjclose": 14.39
        },
        "1415284200": {
            "date": "06-11-2014",
            "open": 14.77,
            "high": 14.94,
            "low": 14.77,
            "close": 14.89,
            "adjclose": 14.51
        },
        "1415370600": {
            "date": "07-11-2014",
            "open": 14.85,
            "high": 14.97,
            "low": 14.72,
            "close": 14.77,
            "adjclose": 14.39
        },
        "1415629800": {
            "date": "10-11-2014",
            "open": 14.84,
            "high": 14.98,
            "low": 14.72,
            "close": 14.95,
            "adjclose": 14.58
        },
        "1415716200": {
            "date": "11-11-2014",
            "open": 14.96,
            "high": 15.05,
            "low": 14.92,
            "close": 15,
            "adjclose": 14.62
        },
        "1415802600": {
            "date": "12-11-2014",
            "open": 15,
            "high": 15.11,
            "low": 14.86,
            "close": 14.98,
            "adjclose": 14.6
        },
        "1415889000": {
            "date": "13-11-2014",
            "open": 14.91,
            "high": 15.07,
            "low": 14.68,
            "close": 14.8,
            "adjclose": 14.43
        },
        "1415975400": {
            "date": "14-11-2014",
            "open": 14.76,
            "high": 14.89,
            "low": 14.59,
            "close": 14.87,
            "adjclose": 14.5
        },
        "1416321000": {
            "date": "18-11-2014",
            "open": 14.76,
            "high": 14.95,
            "low": 14.76,
            "close": 14.92,
            "adjclose": 14.54
        },
        "1416407400": {
            "date": "19-11-2014",
            "open": 14.89,
            "high": 15.06,
            "low": 14.83,
            "close": 15.02,
            "adjclose": 14.64
        },
        "1416493800": {
            "date": "20-11-2014",
            "open": 14.94,
            "high": 15.2,
            "low": 14.94,
            "close": 15.18,
            "adjclose": 14.8
        },
        "1416580200": {
            "date": "21-11-2014",
            "open": 15.34,
            "high": 15.55,
            "low": 15.23,
            "close": 15.28,
            "adjclose": 14.9
        },
        "1416839400": {
            "date": "24-11-2014",
            "open": 15.36,
            "high": 15.51,
            "low": 15.34,
            "close": 15.44,
            "adjclose": 15.05
        },
        "1416925800": {
            "date": "25-11-2014",
            "open": 15.44,
            "high": 15.55,
            "low": 15.23,
            "close": 15.29,
            "adjclose": 14.9
        },
        "1417012200": {
            "date": "26-11-2014",
            "open": 15.29,
            "high": 15.5,
            "low": 15.28,
            "close": 15.45,
            "adjclose": 15.06
        },
        "1417098600": {
            "date": "27-11-2014",
            "open": 15.42,
            "high": 15.47,
            "low": 15.34,
            "close": 15.37,
            "adjclose": 14.98
        },
        "1417185000": {
            "date": "28-11-2014",
            "open": 15.45,
            "high": 15.49,
            "low": 15.26,
            "close": 15.35,
            "adjclose": 14.97
        },
        "1417444200": {
            "date": "01-12-2014",
            "open": 15.29,
            "high": 15.34,
            "low": 15,
            "close": 15.03,
            "adjclose": 14.65
        },
        "1417530600": {
            "date": "02-12-2014",
            "open": 15.04,
            "high": 15.1,
            "low": 14.69,
            "close": 14.73,
            "adjclose": 14.36
        },
        "1417617000": {
            "date": "03-12-2014",
            "open": 14.73,
            "high": 14.85,
            "low": 14.64,
            "close": 14.67,
            "adjclose": 14.3
        },
        "1417703400": {
            "date": "04-12-2014",
            "open": 14.62,
            "high": 14.76,
            "low": 14.54,
            "close": 14.61,
            "adjclose": 14.24
        },
        "1417789800": {
            "date": "05-12-2014",
            "open": 14.52,
            "high": 14.82,
            "low": 14.52,
            "close": 14.69,
            "adjclose": 14.32
        },
        "1418049000": {
            "date": "08-12-2014",
            "open": 14.84,
            "high": 14.84,
            "low": 14.41,
            "close": 14.46,
            "adjclose": 14.09
        },
        "1418135400": {
            "date": "09-12-2014",
            "open": 14.38,
            "high": 14.38,
            "low": 14,
            "close": 14.16,
            "adjclose": 13.8
        },
        "1418221800": {
            "date": "10-12-2014",
            "open": 14.05,
            "high": 14.26,
            "low": 13.74,
            "close": 13.79,
            "adjclose": 13.44
        },
        "1418308200": {
            "date": "11-12-2014",
            "open": 13.73,
            "high": 14.22,
            "low": 13.73,
            "close": 13.93,
            "adjclose": 13.58
        },
        "1418653800": {
            "date": "15-12-2014",
            "open": 13.41,
            "high": 13.65,
            "low": 13.07,
            "close": 13.12,
            "adjclose": 12.79
        },
        "1418740200": {
            "date": "16-12-2014",
            "open": 12.98,
            "high": 13.48,
            "low": 12.73,
            "close": 13.14,
            "adjclose": 12.81
        },
        "1418826600": {
            "date": "17-12-2014",
            "open": 13.33,
            "high": 13.46,
            "low": 13.02,
            "close": 13.41,
            "adjclose": 13.08
        },
        "1418913000": {
            "date": "18-12-2014",
            "open": 13.54,
            "high": 14.11,
            "low": 13.43,
            "close": 14.03,
            "adjclose": 13.67
        },
        "1418999400": {
            "date": "19-12-2014",
            "open": 14.05,
            "high": 14.22,
            "low": 13.84,
            "close": 13.94,
            "adjclose": 13.59
        },
        "1419258600": {
            "date": "22-12-2014",
            "open": 13.98,
            "high": 14,
            "low": 13.73,
            "close": 13.83,
            "adjclose": 13.48
        },
        "1419345000": {
            "date": "23-12-2014",
            "open": 13.9,
            "high": 13.93,
            "low": 13.65,
            "close": 13.67,
            "adjclose": 13.33
        },
        "1419431400": {
            "date": "24-12-2014",
            "open": 13.73,
            "high": 13.73,
            "low": 13.46,
            "close": 13.52,
            "adjclose": 13.18
        },
        "1419604200": {
            "date": "26-12-2014",
            "open": 13.59,
            "high": 13.59,
            "low": 13.33,
            "close": 13.4,
            "adjclose": 13.06
        },
        "1419863400": {
            "date": "29-12-2014",
            "open": 13.42,
            "high": 13.63,
            "low": 13.36,
            "close": 13.52,
            "adjclose": 13.18
        },
        "1419949800": {
            "date": "30-12-2014",
            "open": 13.49,
            "high": 13.67,
            "low": 13.43,
            "close": 13.52,
            "adjclose": 13.18
        },
        "1420036200": {
            "date": "31-12-2014",
            "open": 13.49,
            "high": 13.62,
            "low": 13.35,
            "close": 13.37,
            "adjclose": 13.03
        },
        "1420209000": {
            "date": "02-01-2015",
            "open": 13.43,
            "high": 13.52,
            "low": 12.97,
            "close": 13.05,
            "adjclose": 12.72
        },
        "1420468200": {
            "date": "05-01-2015",
            "open": 13.11,
            "high": 13.11,
            "low": 12.61,
            "close": 12.74,
            "adjclose": 12.42
        },
        "1420554600": {
            "date": "06-01-2015",
            "open": 12.8,
            "high": 13.02,
            "low": 12.6,
            "close": 12.92,
            "adjclose": 12.59
        },
        "1420641000": {
            "date": "07-01-2015",
            "open": 13.1,
            "high": 13.3,
            "low": 12.93,
            "close": 13.21,
            "adjclose": 12.88
        },
        "1420727400": {
            "date": "08-01-2015",
            "open": 13.33,
            "high": 13.47,
            "low": 13.28,
            "close": 13.38,
            "adjclose": 13.04
        },
        "1420813800": {
            "date": "09-01-2015",
            "open": 13.43,
            "high": 13.43,
            "low": 13.12,
            "close": 13.33,
            "adjclose": 13
        },
        "1421073000": {
            "date": "12-01-2015",
            "open": 13.35,
            "high": 13.4,
            "low": 13.11,
            "close": 13.13,
            "adjclose": 12.8
        },
        "1421159400": {
            "date": "13-01-2015",
            "open": 13.16,
            "high": 13.25,
            "low": 12.85,
            "close": 12.93,
            "adjclose": 12.6
        },
        "1421245800": {
            "date": "14-01-2015",
            "open": 12.8,
            "high": 12.82,
            "low": 12.29,
            "close": 12.44,
            "adjclose": 12.12
        },
        "1421332200": {
            "date": "15-01-2015",
            "open": 12.54,
            "high": 12.63,
            "low": 12.31,
            "close": 12.37,
            "adjclose": 12.06
        },
        "1421418600": {
            "date": "16-01-2015",
            "open": 12.37,
            "high": 12.44,
            "low": 12.07,
            "close": 12.18,
            "adjclose": 11.87
        },
        "1421677800": {
            "date": "19-01-2015",
            "open": 12.29,
            "high": 12.43,
            "low": 12.14,
            "close": 12.18,
            "adjclose": 11.87
        },
        "1421764200": {
            "date": "20-01-2015",
            "open": 12.21,
            "high": 12.39,
            "low": 12.13,
            "close": 12.35,
            "adjclose": 12.04
        },
        "1421850600": {
            "date": "21-01-2015",
            "open": 12.4,
            "high": 12.4,
            "low": 12.1,
            "close": 12.33,
            "adjclose": 12.02
        },
        "1421937000": {
            "date": "22-01-2015",
            "open": 12.37,
            "high": 12.74,
            "low": 12.25,
            "close": 12.69,
            "adjclose": 12.37
        },
        "1422023400": {
            "date": "23-01-2015",
            "open": 12.69,
            "high": 12.85,
            "low": 12.37,
            "close": 12.43,
            "adjclose": 12.11
        },
        "1422282600": {
            "date": "26-01-2015",
            "open": 12.5,
            "high": 12.53,
            "low": 12.36,
            "close": 12.46,
            "adjclose": 12.15
        },
        "1422369000": {
            "date": "27-01-2015",
            "open": 12.39,
            "high": 12.55,
            "low": 12.28,
            "close": 12.52,
            "adjclose": 12.2
        },
        "1422455400": {
            "date": "28-01-2015",
            "open": 12.51,
            "high": 12.54,
            "low": 12.22,
            "close": 12.29,
            "adjclose": 11.98
        },
        "1422541800": {
            "date": "29-01-2015",
            "open": 12.25,
            "high": 12.47,
            "low": 12.21,
            "close": 12.37,
            "adjclose": 12.05
        },
        "1422628200": {
            "date": "30-01-2015",
            "open": 12.37,
            "high": 12.37,
            "low": 11.78,
            "close": 11.83,
            "adjclose": 11.53
        },
        "1422973800": {
            "date": "03-02-2015",
            "open": 11.95,
            "high": 12.22,
            "low": 11.89,
            "close": 12.2,
            "adjclose": 11.89
        },
        "1423060200": {
            "date": "04-02-2015",
            "open": 12.24,
            "high": 12.28,
            "low": 11.53,
            "close": 11.61,
            "adjclose": 11.32
        },
        "1423146600": {
            "date": "05-02-2015",
            "open": 12.05,
            "high": 13.17,
            "low": 11.87,
            "close": 13.13,
            "adjclose": 12.8
        },
        "1423233000": {
            "date": "06-02-2015",
            "open": 13.16,
            "high": 13.49,
            "low": 13,
            "close": 13.07,
            "adjclose": 12.74
        },
        "1423492200": {
            "date": "09-02-2015",
            "open": 13.1,
            "high": 13.42,
            "low": 13.01,
            "close": 13.25,
            "adjclose": 12.92
        },
        "1423578600": {
            "date": "10-02-2015",
            "open": 13.33,
            "high": 13.62,
            "low": 12.93,
            "close": 12.95,
            "adjclose": 12.63
        },
        "1423665000": {
            "date": "11-02-2015",
            "open": 12.97,
            "high": 13.3,
            "low": 12.71,
            "close": 12.81,
            "adjclose": 12.49
        },
        "1423751400": {
            "date": "12-02-2015",
            "open": 12.89,
            "high": 13.29,
            "low": 12.85,
            "close": 13.19,
            "adjclose": 12.86
        },
        "1423837800": {
            "date": "13-02-2015",
            "open": 13.26,
            "high": 13.33,
            "low": 13.01,
            "close": 13.05,
            "adjclose": 12.72
        },
        "1424097000": {
            "date": "16-02-2015",
            "open": 13.02,
            "high": 13.14,
            "low": 12.98,
            "close": 13.02,
            "adjclose": 12.69
        },
        "1424183400": {
            "date": "17-02-2015",
            "open": 13.02,
            "high": 13.3,
            "low": 12.92,
            "close": 13.28,
            "adjclose": 12.95
        },
        "1424269800": {
            "date": "18-02-2015",
            "open": 13.16,
            "high": 13.41,
            "low": 12.96,
            "close": 13.06,
            "adjclose": 12.73
        },
        "1424356200": {
            "date": "19-02-2015",
            "open": 12.98,
            "high": 13.27,
            "low": 12.98,
            "close": 13.15,
            "adjclose": 12.82
        },
        "1424442600": {
            "date": "20-02-2015",
            "open": 13.11,
            "high": 13.33,
            "low": 13.03,
            "close": 13.31,
            "adjclose": 12.97
        },
        "1424701800": {
            "date": "23-02-2015",
            "open": 13.17,
            "high": 13.51,
            "low": 13.17,
            "close": 13.44,
            "adjclose": 13.1
        },
        "1424788200": {
            "date": "24-02-2015",
            "open": 13.44,
            "high": 13.77,
            "low": 13.44,
            "close": 13.68,
            "adjclose": 13.34
        },
        "1424874600": {
            "date": "25-02-2015",
            "open": 13.68,
            "high": 13.73,
            "low": 13.43,
            "close": 13.51,
            "adjclose": 13.17
        },
        "1424961000": {
            "date": "26-02-2015",
            "open": 13.49,
            "high": 13.87,
            "low": 13.49,
            "close": 13.7,
            "adjclose": 13.35
        },
        "1425047400": {
            "date": "27-02-2015",
            "open": 13.65,
            "high": 13.73,
            "low": 13.38,
            "close": 13.47,
            "adjclose": 13.13
        },
        "1425306600": {
            "date": "02-03-2015",
            "open": 13.42,
            "high": 13.57,
            "low": 13.26,
            "close": 13.5,
            "adjclose": 13.16
        },
        "1425393000": {
            "date": "03-03-2015",
            "open": 13.48,
            "high": 13.48,
            "low": 13.25,
            "close": 13.3,
            "adjclose": 12.96
        },
        "1425479400": {
            "date": "04-03-2015",
            "open": 13.29,
            "high": 13.37,
            "low": 13.07,
            "close": 13.12,
            "adjclose": 12.79
        },
        "1425565800": {
            "date": "05-03-2015",
            "open": 13.08,
            "high": 13.33,
            "low": 13.05,
            "close": 13.27,
            "adjclose": 12.94
        },
        "1425652200": {
            "date": "06-03-2015",
            "open": 13.2,
            "high": 13.41,
            "low": 12.72,
            "close": 12.78,
            "adjclose": 12.46
        },
        "1425911400": {
            "date": "09-03-2015",
            "open": 12.84,
            "high": 12.88,
            "low": 12.73,
            "close": 12.8,
            "adjclose": 12.48
        },
        "1425997800": {
            "date": "10-03-2015",
            "open": 12.81,
            "high": 12.81,
            "low": 12.53,
            "close": 12.7,
            "adjclose": 12.38
        },
        "1426084200": {
            "date": "11-03-2015",
            "open": 12.77,
            "high": 12.87,
            "low": 12.51,
            "close": 12.82,
            "adjclose": 12.5
        },
        "1426170600": {
            "date": "12-03-2015",
            "open": 12.83,
            "high": 13.3,
            "low": 12.82,
            "close": 13.28,
            "adjclose": 12.95
        },
        "1426257000": {
            "date": "13-03-2015",
            "open": 13.28,
            "high": 13.44,
            "low": 13.14,
            "close": 13.3,
            "adjclose": 12.96
        },
        "1426602600": {
            "date": "17-03-2015",
            "open": 13.24,
            "high": 13.29,
            "low": 13.07,
            "close": 13.14,
            "adjclose": 12.81
        },
        "1426689000": {
            "date": "18-03-2015",
            "open": 13.14,
            "high": 13.14,
            "low": 12.7,
            "close": 12.97,
            "adjclose": 12.64
        },
        "1426775400": {
            "date": "19-03-2015",
            "open": 13.03,
            "high": 13.03,
            "low": 12.53,
            "close": 12.7,
            "adjclose": 12.38
        },
        "1426861800": {
            "date": "20-03-2015",
            "open": 12.69,
            "high": 12.88,
            "low": 12.59,
            "close": 12.7,
            "adjclose": 12.38
        },
        "1427121000": {
            "date": "23-03-2015",
            "open": 12.74,
            "high": 12.87,
            "low": 12.58,
            "close": 12.84,
            "adjclose": 12.51
        },
        "1427207400": {
            "date": "24-03-2015",
            "open": 12.86,
            "high": 13.12,
            "low": 12.86,
            "close": 13.02,
            "adjclose": 12.69
        },
        "1427293800": {
            "date": "25-03-2015",
            "open": 13.09,
            "high": 13.23,
            "low": 12.84,
            "close": 12.94,
            "adjclose": 12.62
        },
        "1427380200": {
            "date": "26-03-2015",
            "open": 12.9,
            "high": 12.98,
            "low": 12.7,
            "close": 12.73,
            "adjclose": 12.41
        },
        "1427466600": {
            "date": "27-03-2015",
            "open": 12.76,
            "high": 12.88,
            "low": 12.69,
            "close": 12.79,
            "adjclose": 12.47
        },
        "1427725800": {
            "date": "30-03-2015",
            "open": 12.81,
            "high": 13.01,
            "low": 12.77,
            "close": 12.9,
            "adjclose": 12.57
        },
        "1427812200": {
            "date": "31-03-2015",
            "open": 12.8,
            "high": 13.01,
            "low": 12.79,
            "close": 12.86,
            "adjclose": 12.54
        },
        "1427898600": {
            "date": "01-04-2015",
            "open": 12.8,
            "high": 12.9,
            "low": 12.69,
            "close": 12.74,
            "adjclose": 12.42
        },
        "1428327000": {
            "date": "06-04-2015",
            "open": 12.79,
            "high": 13.41,
            "low": 12.76,
            "close": 13.36,
            "adjclose": 13.02
        },
        "1428413400": {
            "date": "07-04-2015",
            "open": 13.29,
            "high": 13.6,
            "low": 13.21,
            "close": 13.43,
            "adjclose": 13.09
        },
        "1428499800": {
            "date": "08-04-2015",
            "open": 13.33,
            "high": 13.47,
            "low": 13.11,
            "close": 13.16,
            "adjclose": 12.82
        },
        "1428586200": {
            "date": "09-04-2015",
            "open": 13.16,
            "high": 13.31,
            "low": 13.09,
            "close": 13.21,
            "adjclose": 12.88
        },
        "1428672600": {
            "date": "10-04-2015",
            "open": 13.16,
            "high": 13.29,
            "low": 13.16,
            "close": 13.23,
            "adjclose": 12.89
        },
        "1428931800": {
            "date": "13-04-2015",
            "open": 13.23,
            "high": 13.41,
            "low": 13.2,
            "close": 13.25,
            "adjclose": 12.91
        },
        "1429018200": {
            "date": "14-04-2015",
            "open": 13.25,
            "high": 13.35,
            "low": 13.18,
            "close": 13.32,
            "adjclose": 12.98
        },
        "1429104600": {
            "date": "15-04-2015",
            "open": 13.35,
            "high": 13.69,
            "low": 13.3,
            "close": 13.65,
            "adjclose": 13.3
        },
        "1429191000": {
            "date": "16-04-2015",
            "open": 13.54,
            "high": 13.63,
            "low": 13.43,
            "close": 13.6,
            "adjclose": 13.26
        },
        "1429277400": {
            "date": "17-04-2015",
            "open": 13.6,
            "high": 13.6,
            "low": 13.35,
            "close": 13.43,
            "adjclose": 13.09
        },
        "1429536600": {
            "date": "20-04-2015",
            "open": 13.47,
            "high": 13.53,
            "low": 13.24,
            "close": 13.38,
            "adjclose": 13.04
        },
        "1429623000": {
            "date": "21-04-2015",
            "open": 13.4,
            "high": 13.69,
            "low": 13.36,
            "close": 13.45,
            "adjclose": 13.11
        },
        "1429709400": {
            "date": "22-04-2015",
            "open": 13.47,
            "high": 13.78,
            "low": 13.4,
            "close": 13.71,
            "adjclose": 13.36
        },
        "1429795800": {
            "date": "23-04-2015",
            "open": 13.71,
            "high": 14.01,
            "low": 13.65,
            "close": 13.82,
            "adjclose": 13.47
        },
        "1429882200": {
            "date": "24-04-2015",
            "open": 13.87,
            "high": 14.22,
            "low": 13.8,
            "close": 14.15,
            "adjclose": 13.8
        },
        "1430141400": {
            "date": "27-04-2015",
            "open": 14.22,
            "high": 14.55,
            "low": 14.22,
            "close": 14.25,
            "adjclose": 13.89
        },
        "1430227800": {
            "date": "28-04-2015",
            "open": 14.34,
            "high": 14.38,
            "low": 14.07,
            "close": 14.16,
            "adjclose": 13.81
        },
        "1430314200": {
            "date": "29-04-2015",
            "open": 14.21,
            "high": 14.21,
            "low": 14.01,
            "close": 14.07,
            "adjclose": 13.72
        },
        "1430400600": {
            "date": "30-04-2015",
            "open": 14.15,
            "high": 14.19,
            "low": 13.62,
            "close": 13.68,
            "adjclose": 13.34
        },
        "1430746200": {
            "date": "04-05-2015",
            "open": 13.77,
            "high": 13.92,
            "low": 13.76,
            "close": 13.88,
            "adjclose": 13.53
        },
        "1430832600": {
            "date": "05-05-2015",
            "open": 13.84,
            "high": 13.99,
            "low": 13.74,
            "close": 13.81,
            "adjclose": 13.46
        },
        "1430919000": {
            "date": "06-05-2015",
            "open": 13.84,
            "high": 13.91,
            "low": 13.66,
            "close": 13.69,
            "adjclose": 13.35
        },
        "1431005400": {
            "date": "07-05-2015",
            "open": 13.68,
            "high": 13.97,
            "low": 13.64,
            "close": 13.79,
            "adjclose": 13.45
        },
        "1431091800": {
            "date": "08-05-2015",
            "open": 13.87,
            "high": 14.18,
            "low": 13.86,
            "close": 14.12,
            "adjclose": 13.76
        },
        "1431351000": {
            "date": "11-05-2015",
            "open": 14.15,
            "high": 14.32,
            "low": 14.14,
            "close": 14.28,
            "adjclose": 13.91
        },
        "1431437400": {
            "date": "12-05-2015",
            "open": 14.23,
            "high": 14.33,
            "low": 14.17,
            "close": 14.24,
            "adjclose": 13.88
        },
        "1431523800": {
            "date": "13-05-2015",
            "open": 14.3,
            "high": 14.3,
            "low": 14.15,
            "close": 14.2,
            "adjclose": 13.84
        },
        "1431610200": {
            "date": "14-05-2015",
            "open": 14.17,
            "high": 14.47,
            "low": 14.17,
            "close": 14.34,
            "adjclose": 13.98
        },
        "1431696600": {
            "date": "15-05-2015",
            "open": 14.28,
            "high": 14.51,
            "low": 14.28,
            "close": 14.49,
            "adjclose": 14.12
        },
        "1431955800": {
            "date": "18-05-2015",
            "open": 14.52,
            "high": 14.52,
            "low": 14.19,
            "close": 14.34,
            "adjclose": 13.98
        },
        "1432042200": {
            "date": "19-05-2015",
            "open": 14.34,
            "high": 14.48,
            "low": 14.28,
            "close": 14.31,
            "adjclose": 13.95
        },
        "1432128600": {
            "date": "20-05-2015",
            "open": 14.31,
            "high": 14.46,
            "low": 14.12,
            "close": 14.16,
            "adjclose": 13.81
        },
        "1432215000": {
            "date": "21-05-2015",
            "open": 14.23,
            "high": 14.23,
            "low": 13.88,
            "close": 14.15,
            "adjclose": 13.79
        },
        "1432301400": {
            "date": "22-05-2015",
            "open": 14.15,
            "high": 14.15,
            "low": 13.81,
            "close": 13.87,
            "adjclose": 13.52
        },
        "1432560600": {
            "date": "25-05-2015",
            "open": 13.87,
            "high": 13.91,
            "low": 13.8,
            "close": 13.83,
            "adjclose": 13.48
        },
        "1432647000": {
            "date": "26-05-2015",
            "open": 13.8,
            "high": 13.81,
            "low": 13.54,
            "close": 13.66,
            "adjclose": 13.31
        },
        "1432733400": {
            "date": "27-05-2015",
            "open": 13.69,
            "high": 13.94,
            "low": 13.68,
            "close": 13.91,
            "adjclose": 13.56
        },
        "1432819800": {
            "date": "28-05-2015",
            "open": 13.95,
            "high": 13.95,
            "low": 13.51,
            "close": 13.58,
            "adjclose": 13.24
        },
        "1432906200": {
            "date": "29-05-2015",
            "open": 13.59,
            "high": 13.62,
            "low": 13.28,
            "close": 13.33,
            "adjclose": 13
        },
        "1433165400": {
            "date": "01-06-2015",
            "open": 13.39,
            "high": 13.4,
            "low": 13.05,
            "close": 13.22,
            "adjclose": 12.89
        },
        "1433251800": {
            "date": "02-06-2015",
            "open": 13.27,
            "high": 13.72,
            "low": 13.15,
            "close": 13.48,
            "adjclose": 13.14
        },
        "1433338200": {
            "date": "03-06-2015",
            "open": 13.58,
            "high": 13.67,
            "low": 13.21,
            "close": 13.27,
            "adjclose": 12.93
        },
        "1433424600": {
            "date": "04-06-2015",
            "open": 13.27,
            "high": 13.33,
            "low": 13.11,
            "close": 13.17,
            "adjclose": 12.84
        },
        "1433511000": {
            "date": "05-06-2015",
            "open": 13.26,
            "high": 13.48,
            "low": 13.15,
            "close": 13.44,
            "adjclose": 13.1
        },
        "1433770200": {
            "date": "08-06-2015",
            "open": 13.39,
            "high": 13.51,
            "low": 13.38,
            "close": 13.47,
            "adjclose": 13.13
        },
        "1433856600": {
            "date": "09-06-2015",
            "open": 13.5,
            "high": 13.54,
            "low": 13.38,
            "close": 13.51,
            "adjclose": 13.17
        },
        "1433943000": {
            "date": "10-06-2015",
            "open": 13.58,
            "high": 13.82,
            "low": 13.54,
            "close": 13.64,
            "adjclose": 13.29
        },
        "1434029400": {
            "date": "11-06-2015",
            "open": 13.67,
            "high": 13.7,
            "low": 13.56,
            "close": 13.6,
            "adjclose": 13.26
        },
        "1434115800": {
            "date": "12-06-2015",
            "open": 13.59,
            "high": 13.69,
            "low": 13.56,
            "close": 13.62,
            "adjclose": 13.27
        },
        "1434375000": {
            "date": "15-06-2015",
            "open": 13.6,
            "high": 13.6,
            "low": 13.41,
            "close": 13.46,
            "adjclose": 13.12
        },
        "1434461400": {
            "date": "16-06-2015",
            "open": 13.41,
            "high": 13.65,
            "low": 13.38,
            "close": 13.55,
            "adjclose": 13.21
        },
        "1434547800": {
            "date": "17-06-2015",
            "open": 13.58,
            "high": 13.72,
            "low": 13.47,
            "close": 13.66,
            "adjclose": 13.32
        },
        "1434634200": {
            "date": "18-06-2015",
            "open": 13.66,
            "high": 13.78,
            "low": 13.64,
            "close": 13.72,
            "adjclose": 13.37
        },
        "1434720600": {
            "date": "19-06-2015",
            "open": 13.68,
            "high": 13.78,
            "low": 13.62,
            "close": 13.64,
            "adjclose": 13.29
        },
        "1434979800": {
            "date": "22-06-2015",
            "open": 13.74,
            "high": 13.78,
            "low": 13.66,
            "close": 13.72,
            "adjclose": 13.37
        },
        "1435066200": {
            "date": "23-06-2015",
            "open": 13.77,
            "high": 13.91,
            "low": 13.73,
            "close": 13.79,
            "adjclose": 13.45
        },
        "1435152600": {
            "date": "24-06-2015",
            "open": 13.79,
            "high": 13.83,
            "low": 13.5,
            "close": 13.6,
            "adjclose": 13.26
        },
        "1435239000": {
            "date": "25-06-2015",
            "open": 13.54,
            "high": 13.7,
            "low": 13.53,
            "close": 13.64,
            "adjclose": 13.29
        },
        "1435325400": {
            "date": "26-06-2015",
            "open": 13.66,
            "high": 13.82,
            "low": 13.63,
            "close": 13.66,
            "adjclose": 13.32
        },
        "1435584600": {
            "date": "29-06-2015",
            "open": 13.49,
            "high": 13.54,
            "low": 13.14,
            "close": 13.17,
            "adjclose": 12.83
        },
        "1435671000": {
            "date": "30-06-2015",
            "open": 13.3,
            "high": 13.35,
            "low": 13.17,
            "close": 13.32,
            "adjclose": 12.99
        },
        "1435757400": {
            "date": "01-07-2015",
            "open": 13.37,
            "high": 13.47,
            "low": 13.22,
            "close": 13.25,
            "adjclose": 12.91
        },
        "1435843800": {
            "date": "02-07-2015",
            "open": 13.3,
            "high": 13.38,
            "low": 13.17,
            "close": 13.25,
            "adjclose": 12.91
        },
        "1435930200": {
            "date": "03-07-2015",
            "open": 13.3,
            "high": 13.3,
            "low": 13.16,
            "close": 13.28,
            "adjclose": 12.94
        },
        "1436189400": {
            "date": "06-07-2015",
            "open": 13.21,
            "high": 13.22,
            "low": 12.99,
            "close": 13.04,
            "adjclose": 12.71
        },
        "1436275800": {
            "date": "07-07-2015",
            "open": 13.04,
            "high": 13.21,
            "low": 12.76,
            "close": 13.17,
            "adjclose": 12.84
        },
        "1436362200": {
            "date": "08-07-2015",
            "open": 13.17,
            "high": 13.17,
            "low": 12.76,
            "close": 12.78,
            "adjclose": 12.45
        },
        "1436448600": {
            "date": "09-07-2015",
            "open": 12.95,
            "high": 13.17,
            "low": 12.89,
            "close": 12.95,
            "adjclose": 12.63
        },
        "1436535000": {
            "date": "10-07-2015",
            "open": 13.09,
            "high": 13.21,
            "low": 13.01,
            "close": 13.15,
            "adjclose": 12.82
        },
        "1436794200": {
            "date": "13-07-2015",
            "open": 13.17,
            "high": 13.3,
            "low": 13.16,
            "close": 13.26,
            "adjclose": 12.92
        },
        "1436880600": {
            "date": "14-07-2015",
            "open": 13.23,
            "high": 13.31,
            "low": 13.17,
            "close": 13.25,
            "adjclose": 12.91
        },
        "1436967000": {
            "date": "15-07-2015",
            "open": 13.21,
            "high": 13.29,
            "low": 13.13,
            "close": 13.15,
            "adjclose": 12.82
        },
        "1437053400": {
            "date": "16-07-2015",
            "open": 13.2,
            "high": 13.24,
            "low": 13.08,
            "close": 13.16,
            "adjclose": 12.82
        },
        "1437139800": {
            "date": "17-07-2015",
            "open": 13.14,
            "high": 13.28,
            "low": 13.14,
            "close": 13.27,
            "adjclose": 12.93
        },
        "1437399000": {
            "date": "20-07-2015",
            "open": 13.28,
            "high": 13.44,
            "low": 13.18,
            "close": 13.39,
            "adjclose": 13.05
        },
        "1437485400": {
            "date": "21-07-2015",
            "open": 13.39,
            "high": 13.54,
            "low": 13.11,
            "close": 13.16,
            "adjclose": 12.82
        },
        "1437571800": {
            "date": "22-07-2015",
            "open": 13.34,
            "high": 13.64,
            "low": 13.22,
            "close": 13.26,
            "adjclose": 12.92
        },
        "1437658200": {
            "date": "23-07-2015",
            "open": 13.3,
            "high": 13.38,
            "low": 12.75,
            "close": 12.97,
            "adjclose": 12.64
        },
        "1437744600": {
            "date": "24-07-2015",
            "open": 13.03,
            "high": 13.03,
            "low": 12.11,
            "close": 12.18,
            "adjclose": 11.87
        },
        "1438003800": {
            "date": "27-07-2015",
            "open": 12.02,
            "high": 12.2,
            "low": 11.6,
            "close": 11.87,
            "adjclose": 11.57
        },
        "1438090200": {
            "date": "28-07-2015",
            "open": 12.03,
            "high": 12.61,
            "low": 11.89,
            "close": 12.57,
            "adjclose": 12.26
        },
        "1438176600": {
            "date": "29-07-2015",
            "open": 12.58,
            "high": 12.86,
            "low": 12.48,
            "close": 12.83,
            "adjclose": 12.51
        },
        "1438263000": {
            "date": "30-07-2015",
            "open": 12.83,
            "high": 12.9,
            "low": 12.45,
            "close": 12.6,
            "adjclose": 12.28
        },
        "1438349400": {
            "date": "31-07-2015",
            "open": 12.66,
            "high": 12.76,
            "low": 12.42,
            "close": 12.69,
            "adjclose": 12.37
        },
        "1438608600": {
            "date": "03-08-2015",
            "open": 12.66,
            "high": 12.66,
            "low": 12.42,
            "close": 12.58,
            "adjclose": 12.27
        },
        "1438695000": {
            "date": "04-08-2015",
            "open": 12.59,
            "high": 12.65,
            "low": 12.35,
            "close": 12.4,
            "adjclose": 12.09
        },
        "1438781400": {
            "date": "05-08-2015",
            "open": 12.49,
            "high": 12.63,
            "low": 12.19,
            "close": 12.25,
            "adjclose": 11.94
        },
        "1438867800": {
            "date": "06-08-2015",
            "open": 12.34,
            "high": 12.51,
            "low": 12.19,
            "close": 12.44,
            "adjclose": 12.13
        },
        "1438954200": {
            "date": "07-08-2015",
            "open": 12.37,
            "high": 12.79,
            "low": 12.37,
            "close": 12.74,
            "adjclose": 12.42
        },
        "1439213400": {
            "date": "10-08-2015",
            "open": 12.76,
            "high": 12.95,
            "low": 12.75,
            "close": 12.91,
            "adjclose": 12.58
        },
        "1439299800": {
            "date": "11-08-2015",
            "open": 12.8,
            "high": 12.88,
            "low": 12.25,
            "close": 12.3,
            "adjclose": 11.99
        },
        "1439386200": {
            "date": "12-08-2015",
            "open": 12.19,
            "high": 12.3,
            "low": 11.95,
            "close": 12.19,
            "adjclose": 11.88
        },
        "1439472600": {
            "date": "13-08-2015",
            "open": 12.27,
            "high": 12.3,
            "low": 12.02,
            "close": 12.17,
            "adjclose": 11.86
        },
        "1439559000": {
            "date": "14-08-2015",
            "open": 12.2,
            "high": 12.32,
            "low": 12.11,
            "close": 12.23,
            "adjclose": 11.92
        },
        "1439818200": {
            "date": "17-08-2015",
            "open": 12.21,
            "high": 12.3,
            "low": 12.08,
            "close": 12.12,
            "adjclose": 11.81
        },
        "1439904600": {
            "date": "18-08-2015",
            "open": 12.12,
            "high": 12.28,
            "low": 12.05,
            "close": 12.25,
            "adjclose": 11.94
        },
        "1439991000": {
            "date": "19-08-2015",
            "open": 12.11,
            "high": 12.31,
            "low": 12.04,
            "close": 12.11,
            "adjclose": 11.81
        },
        "1440077400": {
            "date": "20-08-2015",
            "open": 12.02,
            "high": 12.06,
            "low": 11.6,
            "close": 11.65,
            "adjclose": 11.36
        },
        "1440163800": {
            "date": "21-08-2015",
            "open": 11.6,
            "high": 11.6,
            "low": 10.92,
            "close": 11.05,
            "adjclose": 10.77
        },
        "1440423000": {
            "date": "24-08-2015",
            "open": 10.49,
            "high": 11.02,
            "low": 9.8,
            "close": 10.91,
            "adjclose": 10.63
        },
        "1440509400": {
            "date": "25-08-2015",
            "open": 11.36,
            "high": 11.43,
            "low": 11,
            "close": 11.05,
            "adjclose": 10.77
        },
        "1440595800": {
            "date": "26-08-2015",
            "open": 11.2,
            "high": 11.28,
            "low": 10.85,
            "close": 11.21,
            "adjclose": 10.92
        },
        "1440682200": {
            "date": "27-08-2015",
            "open": 11.37,
            "high": 11.97,
            "low": 11.33,
            "close": 11.87,
            "adjclose": 11.57
        },
        "1440768600": {
            "date": "28-08-2015",
            "open": 11.79,
            "high": 12.02,
            "low": 11.7,
            "close": 11.87,
            "adjclose": 11.57
        },
        "1441027800": {
            "date": "31-08-2015",
            "open": 11.77,
            "high": 12.2,
            "low": 11.58,
            "close": 12.14,
            "adjclose": 11.83
        },
        "1441114200": {
            "date": "01-09-2015",
            "open": 11.82,
            "high": 11.92,
            "low": 11.41,
            "close": 11.47,
            "adjclose": 11.18
        },
        "1441200600": {
            "date": "02-09-2015",
            "open": 11.56,
            "high": 11.75,
            "low": 11.37,
            "close": 11.71,
            "adjclose": 11.42
        },
        "1441287000": {
            "date": "03-09-2015",
            "open": 11.61,
            "high": 12.06,
            "low": 11.61,
            "close": 11.78,
            "adjclose": 11.48
        },
        "1441373400": {
            "date": "04-09-2015",
            "open": 11.65,
            "high": 11.74,
            "low": 11.41,
            "close": 11.58,
            "adjclose": 11.28
        },
        "1441632600": {
            "date": "07-09-2015",
            "open": 11.44,
            "high": 11.65,
            "low": 11.44,
            "close": 11.52,
            "adjclose": 11.23
        },
        "1441719000": {
            "date": "08-09-2015",
            "open": 11.7,
            "high": 11.88,
            "low": 11.62,
            "close": 11.8,
            "adjclose": 11.5
        },
        "1441805400": {
            "date": "09-09-2015",
            "open": 11.91,
            "high": 12.08,
            "low": 11.71,
            "close": 11.76,
            "adjclose": 11.46
        },
        "1441891800": {
            "date": "10-09-2015",
            "open": 11.74,
            "high": 12.02,
            "low": 11.57,
            "close": 11.98,
            "adjclose": 11.68
        },
        "1441978200": {
            "date": "11-09-2015",
            "open": 11.95,
            "high": 12.04,
            "low": 11.83,
            "close": 11.95,
            "adjclose": 11.64
        },
        "1442237400": {
            "date": "14-09-2015",
            "open": 11.89,
            "high": 12.19,
            "low": 11.84,
            "close": 12.14,
            "adjclose": 11.83
        },
        "1442323800": {
            "date": "15-09-2015",
            "open": 12.2,
            "high": 12.25,
            "low": 12,
            "close": 12.15,
            "adjclose": 11.84
        },
        "1442496600": {
            "date": "17-09-2015",
            "open": 12.39,
            "high": 12.44,
            "low": 12.09,
            "close": 12.3,
            "adjclose": 11.99
        },
        "1442583000": {
            "date": "18-09-2015",
            "open": 12.16,
            "high": 12.16,
            "low": 11.84,
            "close": 11.89,
            "adjclose": 11.59
        },
        "1442842200": {
            "date": "21-09-2015",
            "open": 11.93,
            "high": 12.01,
            "low": 11.77,
            "close": 11.85,
            "adjclose": 11.55
        },
        "1442928600": {
            "date": "22-09-2015",
            "open": 11.76,
            "high": 11.76,
            "low": 11.51,
            "close": 11.56,
            "adjclose": 11.27
        },
        "1443015000": {
            "date": "23-09-2015",
            "open": 11.56,
            "high": 11.56,
            "low": 11.02,
            "close": 11.19,
            "adjclose": 10.9
        },
        "1443101400": {
            "date": "24-09-2015",
            "open": 11.11,
            "high": 11.15,
            "low": 10.68,
            "close": 11.07,
            "adjclose": 10.79
        },
        "1443187800": {
            "date": "25-09-2015",
            "open": 11.18,
            "high": 11.22,
            "low": 10.86,
            "close": 10.95,
            "adjclose": 10.67
        },
        "1443447000": {
            "date": "28-09-2015",
            "open": 10.9,
            "high": 10.9,
            "low": 10.52,
            "close": 10.56,
            "adjclose": 10.29
        },
        "1443533400": {
            "date": "29-09-2015",
            "open": 10.66,
            "high": 10.86,
            "low": 10.45,
            "close": 10.69,
            "adjclose": 10.42
        },
        "1443619800": {
            "date": "30-09-2015",
            "open": 10.82,
            "high": 10.94,
            "low": 10.57,
            "close": 10.9,
            "adjclose": 10.63
        },
        "1443706200": {
            "date": "01-10-2015",
            "open": 10.93,
            "high": 11.13,
            "low": 10.81,
            "close": 10.98,
            "adjclose": 10.71
        },
        "1443792600": {
            "date": "02-10-2015",
            "open": 10.79,
            "high": 11.09,
            "low": 10.7,
            "close": 11.06,
            "adjclose": 10.78
        },
        "1444051800": {
            "date": "05-10-2015",
            "open": 11.14,
            "high": 11.47,
            "low": 11.14,
            "close": 11.32,
            "adjclose": 11.03
        },
        "1444138200": {
            "date": "06-10-2015",
            "open": 11.34,
            "high": 11.46,
            "low": 11.23,
            "close": 11.39,
            "adjclose": 11.1
        },
        "1444224600": {
            "date": "07-10-2015",
            "open": 11.51,
            "high": 11.93,
            "low": 11.5,
            "close": 11.87,
            "adjclose": 11.57
        },
        "1444311000": {
            "date": "08-10-2015",
            "open": 11.83,
            "high": 12.12,
            "low": 11.82,
            "close": 12.02,
            "adjclose": 11.72
        },
        "1444397400": {
            "date": "09-10-2015",
            "open": 12.07,
            "high": 12.31,
            "low": 11.89,
            "close": 11.94,
            "adjclose": 11.63
        },
        "1444656600": {
            "date": "12-10-2015",
            "open": 12.02,
            "high": 12.02,
            "low": 11.61,
            "close": 11.78,
            "adjclose": 11.48
        },
        "1444743000": {
            "date": "13-10-2015",
            "open": 11.65,
            "high": 11.97,
            "low": 11.58,
            "close": 11.84,
            "adjclose": 11.54
        },
        "1444829400": {
            "date": "14-10-2015",
            "open": 11.79,
            "high": 12.12,
            "low": 11.79,
            "close": 12.05,
            "adjclose": 11.74
        },
        "1444915800": {
            "date": "15-10-2015",
            "open": 12.1,
            "high": 12.1,
            "low": 11.74,
            "close": 11.77,
            "adjclose": 11.47
        },
        "1445002200": {
            "date": "16-10-2015",
            "open": 11.97,
            "high": 11.98,
            "low": 11.7,
            "close": 11.95,
            "adjclose": 11.64
        },
        "1445261400": {
            "date": "19-10-2015",
            "open": 11.88,
            "high": 11.99,
            "low": 11.77,
            "close": 11.84,
            "adjclose": 11.54
        },
        "1445347800": {
            "date": "20-10-2015",
            "open": 11.83,
            "high": 11.98,
            "low": 11.8,
            "close": 11.86,
            "adjclose": 11.56
        },
        "1445434200": {
            "date": "21-10-2015",
            "open": 11.89,
            "high": 11.94,
            "low": 11.57,
            "close": 11.62,
            "adjclose": 11.33
        },
        "1445520600": {
            "date": "22-10-2015",
            "open": 11.39,
            "high": 11.39,
            "low": 10.69,
            "close": 10.75,
            "adjclose": 10.48
        },
        "1445607000": {
            "date": "23-10-2015",
            "open": 10.87,
            "high": 10.88,
            "low": 10.36,
            "close": 10.73,
            "adjclose": 10.46
        },
        "1445869800": {
            "date": "26-10-2015",
            "open": 10.72,
            "high": 10.79,
            "low": 10.32,
            "close": 10.37,
            "adjclose": 10.11
        },
        "1445956200": {
            "date": "27-10-2015",
            "open": 10.46,
            "high": 10.46,
            "low": 9.87,
            "close": 10.03,
            "adjclose": 9.78
        },
        "1446042600": {
            "date": "28-10-2015",
            "open": 10.1,
            "high": 10.34,
            "low": 10,
            "close": 10.18,
            "adjclose": 9.92
        },
        "1446129000": {
            "date": "29-10-2015",
            "open": 10.2,
            "high": 10.22,
            "low": 9.92,
            "close": 9.99,
            "adjclose": 9.73
        },
        "1446215400": {
            "date": "30-10-2015",
            "open": 9.99,
            "high": 10.04,
            "low": 9.55,
            "close": 9.68,
            "adjclose": 9.44
        },
        "1446561000": {
            "date": "03-11-2015",
            "open": 9.79,
            "high": 9.85,
            "low": 9.45,
            "close": 9.73,
            "adjclose": 9.48
        },
        "1446647400": {
            "date": "04-11-2015",
            "open": 9.84,
            "high": 10.23,
            "low": 9.78,
            "close": 9.82,
            "adjclose": 9.57
        },
        "1446733800": {
            "date": "05-11-2015",
            "open": 9.82,
            "high": 9.92,
            "low": 9.5,
            "close": 9.88,
            "adjclose": 9.63
        },
        "1446820200": {
            "date": "06-11-2015",
            "open": 9.71,
            "high": 9.79,
            "low": 9.5,
            "close": 9.67,
            "adjclose": 9.43
        },
        "1447079400": {
            "date": "09-11-2015",
            "open": 9.6,
            "high": 9.74,
            "low": 9.24,
            "close": 9.27,
            "adjclose": 9.04
        },
        "1447165800": {
            "date": "10-11-2015",
            "open": 9.26,
            "high": 9.35,
            "low": 9.02,
            "close": 9.25,
            "adjclose": 9.02
        },
        "1447252200": {
            "date": "11-11-2015",
            "open": 9.25,
            "high": 9.38,
            "low": 9.1,
            "close": 9.16,
            "adjclose": 8.93
        },
        "1447338600": {
            "date": "12-11-2015",
            "open": 9.11,
            "high": 9.28,
            "low": 9.08,
            "close": 9.13,
            "adjclose": 8.9
        },
        "1447425000": {
            "date": "13-11-2015",
            "open": 9.11,
            "high": 9.16,
            "low": 8.57,
            "close": 8.64,
            "adjclose": 8.43
        },
        "1447770600": {
            "date": "17-11-2015",
            "open": 8.71,
            "high": 9.37,
            "low": 8.65,
            "close": 9.14,
            "adjclose": 8.91
        },
        "1447857000": {
            "date": "18-11-2015",
            "open": 9.13,
            "high": 9.3,
            "low": 9.04,
            "close": 9.2,
            "adjclose": 8.97
        },
        "1447943400": {
            "date": "19-11-2015",
            "open": 9.28,
            "high": 9.36,
            "low": 9.03,
            "close": 9.25,
            "adjclose": 9.01
        },
        "1448029800": {
            "date": "20-11-2015",
            "open": 9.25,
            "high": 9.69,
            "low": 9.22,
            "close": 9.46,
            "adjclose": 9.22
        },
        "1448289000": {
            "date": "23-11-2015",
            "open": 9.43,
            "high": 9.52,
            "low": 9.26,
            "close": 9.29,
            "adjclose": 9.06
        },
        "1448375400": {
            "date": "24-11-2015",
            "open": 9.25,
            "high": 9.42,
            "low": 9.22,
            "close": 9.36,
            "adjclose": 9.12
        },
        "1448461800": {
            "date": "25-11-2015",
            "open": 9.4,
            "high": 9.5,
            "low": 9.25,
            "close": 9.48,
            "adjclose": 9.24
        },
        "1448548200": {
            "date": "26-11-2015",
            "open": 9.43,
            "high": 9.64,
            "low": 9.4,
            "close": 9.59,
            "adjclose": 9.35
        },
        "1448634600": {
            "date": "27-11-2015",
            "open": 9.58,
            "high": 9.63,
            "low": 9.39,
            "close": 9.61,
            "adjclose": 9.36
        },
        "1448893800": {
            "date": "30-11-2015",
            "open": 9.59,
            "high": 9.8,
            "low": 9.53,
            "close": 9.72,
            "adjclose": 9.47
        },
        "1448980200": {
            "date": "01-12-2015",
            "open": 9.74,
            "high": 9.77,
            "low": 9.5,
            "close": 9.56,
            "adjclose": 9.32
        },
        "1449066600": {
            "date": "02-12-2015",
            "open": 9.55,
            "high": 9.66,
            "low": 9.34,
            "close": 9.38,
            "adjclose": 9.15
        },
        "1449153000": {
            "date": "03-12-2015",
            "open": 9.38,
            "high": 9.43,
            "low": 9.14,
            "close": 9.25,
            "adjclose": 9.02
        },
        "1449239400": {
            "date": "04-12-2015",
            "open": 9.21,
            "high": 9.25,
            "low": 9.07,
            "close": 9.22,
            "adjclose": 8.99
        },
        "1449498600": {
            "date": "07-12-2015",
            "open": 9.23,
            "high": 9.26,
            "low": 8.97,
            "close": 9.01,
            "adjclose": 8.78
        },
        "1449585000": {
            "date": "08-12-2015",
            "open": 8.92,
            "high": 8.92,
            "low": 8.64,
            "close": 8.72,
            "adjclose": 8.5
        },
        "1449671400": {
            "date": "09-12-2015",
            "open": 8.73,
            "high": 8.92,
            "low": 8.7,
            "close": 8.83,
            "adjclose": 8.61
        },
        "1449757800": {
            "date": "10-12-2015",
            "open": 8.89,
            "high": 8.91,
            "low": 8.78,
            "close": 8.8,
            "adjclose": 8.58
        },
        "1449844200": {
            "date": "11-12-2015",
            "open": 8.74,
            "high": 8.76,
            "low": 8.31,
            "close": 8.34,
            "adjclose": 8.13
        },
        "1450103400": {
            "date": "14-12-2015",
            "open": 8.21,
            "high": 8.28,
            "low": 7.99,
            "close": 8.08,
            "adjclose": 7.88
        },
        "1450189800": {
            "date": "15-12-2015",
            "open": 8.23,
            "high": 8.37,
            "low": 8.15,
            "close": 8.27,
            "adjclose": 8.07
        },
        "1450276200": {
            "date": "16-12-2015",
            "open": 8.36,
            "high": 8.5,
            "low": 8.16,
            "close": 8.41,
            "adjclose": 8.2
        },
        "1450362600": {
            "date": "17-12-2015",
            "open": 8.48,
            "high": 8.58,
            "low": 8.39,
            "close": 8.45,
            "adjclose": 8.24
        },
        "1450449000": {
            "date": "18-12-2015",
            "open": 8.43,
            "high": 8.43,
            "low": 8.24,
            "close": 8.3,
            "adjclose": 8.09
        },
        "1450708200": {
            "date": "21-12-2015",
            "open": 8.33,
            "high": 8.38,
            "low": 8.14,
            "close": 8.16,
            "adjclose": 7.96
        },
        "1450794600": {
            "date": "22-12-2015",
            "open": 8.15,
            "high": 8.51,
            "low": 8.15,
            "close": 8.4,
            "adjclose": 8.19
        },
        "1450881000": {
            "date": "23-12-2015",
            "open": 8.48,
            "high": 9.04,
            "low": 8.48,
            "close": 9.01,
            "adjclose": 8.78
        },
        "1450967400": {
            "date": "24-12-2015",
            "open": 8.92,
            "high": 9.14,
            "low": 8.92,
            "close": 8.99,
            "adjclose": 8.76
        },
        "1451313000": {
            "date": "28-12-2015",
            "open": 8.97,
            "high": 8.97,
            "low": 8.65,
            "close": 8.68,
            "adjclose": 8.46
        },
        "1451399400": {
            "date": "29-12-2015",
            "open": 8.75,
            "high": 8.79,
            "low": 8.6,
            "close": 8.61,
            "adjclose": 8.39
        },
        "1451485800": {
            "date": "30-12-2015",
            "open": 8.64,
            "high": 8.64,
            "low": 8.52,
            "close": 8.56,
            "adjclose": 8.35
        },
        "1451572200": {
            "date": "31-12-2015",
            "open": 8.51,
            "high": 8.74,
            "low": 8.47,
            "close": 8.72,
            "adjclose": 8.5
        },
        "1451917800": {
            "date": "04-01-2016",
            "open": 8.59,
            "high": 8.74,
            "low": 8.4,
            "close": 8.43,
            "adjclose": 8.22
        },
        "1452004200": {
            "date": "05-01-2016",
            "open": 8.42,
            "high": 8.5,
            "low": 8.25,
            "close": 8.31,
            "adjclose": 8.1
        },
        "1452090600": {
            "date": "06-01-2016",
            "open": 8.22,
            "high": 8.46,
            "low": 8.14,
            "close": 8.29,
            "adjclose": 8.08
        },
        "1452177000": {
            "date": "07-01-2016",
            "open": 8.2,
            "high": 8.2,
            "low": 7.59,
            "close": 7.64,
            "adjclose": 7.44
        },
        "1452263400": {
            "date": "08-01-2016",
            "open": 7.81,
            "high": 7.86,
            "low": 7.15,
            "close": 7.18,
            "adjclose": 7
        },
        "1452522600": {
            "date": "11-01-2016",
            "open": 7.2,
            "high": 7.34,
            "low": 7.12,
            "close": 7.24,
            "adjclose": 7.06
        },
        "1452609000": {
            "date": "12-01-2016",
            "open": 7.31,
            "high": 7.44,
            "low": 7.21,
            "close": 7.39,
            "adjclose": 7.2
        },
        "1452695400": {
            "date": "13-01-2016",
            "open": 7.42,
            "high": 7.6,
            "low": 7.09,
            "close": 7.14,
            "adjclose": 6.96
        },
        "1452781800": {
            "date": "14-01-2016",
            "open": 7.19,
            "high": 7.44,
            "low": 6.99,
            "close": 7.36,
            "adjclose": 7.17
        },
        "1452868200": {
            "date": "15-01-2016",
            "open": 7.2,
            "high": 7.35,
            "low": 6.64,
            "close": 7.32,
            "adjclose": 7.14
        },
        "1453127400": {
            "date": "18-01-2016",
            "open": 7.32,
            "high": 7.33,
            "low": 7.13,
            "close": 7.26,
            "adjclose": 7.07
        },
        "1453213800": {
            "date": "19-01-2016",
            "open": 7.39,
            "high": 7.39,
            "low": 6.82,
            "close": 6.95,
            "adjclose": 6.78
        },
        "1453300200": {
            "date": "20-01-2016",
            "open": 6.77,
            "high": 6.89,
            "low": 6.27,
            "close": 6.81,
            "adjclose": 6.64
        },
        "1453386600": {
            "date": "21-01-2016",
            "open": 6.78,
            "high": 7.37,
            "low": 6.74,
            "close": 7.29,
            "adjclose": 7.1
        },
        "1453473000": {
            "date": "22-01-2016",
            "open": 7.44,
            "high": 7.78,
            "low": 7.32,
            "close": 7.44,
            "adjclose": 7.25
        },
        "1453732200": {
            "date": "25-01-2016",
            "open": 7.44,
            "high": 7.44,
            "low": 6.85,
            "close": 6.91,
            "adjclose": 6.73
        },
        "1453818600": {
            "date": "26-01-2016",
            "open": 6.93,
            "high": 7.11,
            "low": 6.66,
            "close": 7.05,
            "adjclose": 6.88
        },
        "1453905000": {
            "date": "27-01-2016",
            "open": 7.03,
            "high": 7.23,
            "low": 6.92,
            "close": 7.03,
            "adjclose": 6.85
        },
        "1453991400": {
            "date": "28-01-2016",
            "open": 7.21,
            "high": 7.4,
            "low": 6.95,
            "close": 7.21,
            "adjclose": 7.03
        },
        "1454077800": {
            "date": "29-01-2016",
            "open": 7.27,
            "high": 7.64,
            "low": 7.27,
            "close": 7.58,
            "adjclose": 7.39
        },
        "1454423400": {
            "date": "02-02-2016",
            "open": 7.39,
            "high": 7.65,
            "low": 7.24,
            "close": 7.42,
            "adjclose": 7.24
        },
        "1454509800": {
            "date": "03-02-2016",
            "open": 7.42,
            "high": 7.83,
            "low": 7.12,
            "close": 7.77,
            "adjclose": 7.57
        },
        "1454596200": {
            "date": "04-02-2016",
            "open": 8.14,
            "high": 9.03,
            "low": 8.1,
            "close": 8.71,
            "adjclose": 8.49
        },
        "1454682600": {
            "date": "05-02-2016",
            "open": 8.74,
            "high": 8.83,
            "low": 8.51,
            "close": 8.55,
            "adjclose": 8.34
        },
        "1454941800": {
            "date": "08-02-2016",
            "open": 8.42,
            "high": 8.42,
            "low": 7.83,
            "close": 7.91,
            "adjclose": 7.71
        },
        "1455028200": {
            "date": "09-02-2016",
            "open": 7.67,
            "high": 8.14,
            "low": 7.54,
            "close": 7.68,
            "adjclose": 7.49
        },
        "1455114600": {
            "date": "10-02-2016",
            "open": 7.82,
            "high": 7.89,
            "low": 7.56,
            "close": 7.67,
            "adjclose": 7.48
        },
        "1455201000": {
            "date": "11-02-2016",
            "open": 7.46,
            "high": 7.67,
            "low": 7.3,
            "close": 7.55,
            "adjclose": 7.36
        },
        "1455287400": {
            "date": "12-02-2016",
            "open": 7.67,
            "high": 7.86,
            "low": 7.51,
            "close": 7.83,
            "adjclose": 7.63
        },
        "1455546600": {
            "date": "15-02-2016",
            "open": 7.92,
            "high": 8.11,
            "low": 7.91,
            "close": 8.08,
            "adjclose": 7.88
        },
        "1455633000": {
            "date": "16-02-2016",
            "open": 8.22,
            "high": 8.22,
            "low": 7.99,
            "close": 8.13,
            "adjclose": 7.92
        },
        "1455719400": {
            "date": "17-02-2016",
            "open": 8.22,
            "high": 8.94,
            "low": 8.18,
            "close": 8.85,
            "adjclose": 8.62
        },
        "1455805800": {
            "date": "18-02-2016",
            "open": 8.88,
            "high": 8.88,
            "low": 8.33,
            "close": 8.52,
            "adjclose": 8.3
        },
        "1455892200": {
            "date": "19-02-2016",
            "open": 8.5,
            "high": 8.66,
            "low": 8.32,
            "close": 8.56,
            "adjclose": 8.35
        },
        "1456151400": {
            "date": "22-02-2016",
            "open": 8.64,
            "high": 9.1,
            "low": 8.62,
            "close": 9.06,
            "adjclose": 8.83
        },
        "1456237800": {
            "date": "23-02-2016",
            "open": 9.05,
            "high": 9.29,
            "low": 8.89,
            "close": 8.95,
            "adjclose": 8.72
        },
        "1456324200": {
            "date": "24-02-2016",
            "open": 8.89,
            "high": 9.06,
            "low": 8.52,
            "close": 8.99,
            "adjclose": 8.76
        },
        "1456410600": {
            "date": "25-02-2016",
            "open": 9.05,
            "high": 9.14,
            "low": 8.87,
            "close": 9.08,
            "adjclose": 8.85
        },
        "1456497000": {
            "date": "26-02-2016",
            "open": 8.88,
            "high": 9.24,
            "low": 8.88,
            "close": 9.16,
            "adjclose": 8.93
        },
        "1456756200": {
            "date": "29-02-2016",
            "open": 9.19,
            "high": 9.29,
            "low": 9,
            "close": 9.25,
            "adjclose": 9.01
        },
        "1456842600": {
            "date": "01-03-2016",
            "open": 9.25,
            "high": 9.67,
            "low": 9.25,
            "close": 9.63,
            "adjclose": 9.39
        },
        "1456929000": {
            "date": "02-03-2016",
            "open": 9.62,
            "high": 9.83,
            "low": 9.55,
            "close": 9.62,
            "adjclose": 9.38
        },
        "1457015400": {
            "date": "03-03-2016",
            "open": 9.66,
            "high": 9.77,
            "low": 9.5,
            "close": 9.68,
            "adjclose": 9.44
        },
        "1457101800": {
            "date": "04-03-2016",
            "open": 9.74,
            "high": 10.03,
            "low": 9.71,
            "close": 9.74,
            "adjclose": 9.49
        },
        "1457361000": {
            "date": "07-03-2016",
            "open": 9.75,
            "high": 10.3,
            "low": 9.75,
            "close": 10.16,
            "adjclose": 9.9
        },
        "1457447400": {
            "date": "08-03-2016",
            "open": 10.05,
            "high": 10.12,
            "low": 9.77,
            "close": 9.81,
            "adjclose": 9.56
        },
        "1457533800": {
            "date": "09-03-2016",
            "open": 9.92,
            "high": 10.14,
            "low": 9.9,
            "close": 9.96,
            "adjclose": 9.71
        },
        "1457620200": {
            "date": "10-03-2016",
            "open": 10.14,
            "high": 10.14,
            "low": 9.89,
            "close": 10.03,
            "adjclose": 9.78
        },
        "1457706600": {
            "date": "11-03-2016",
            "open": 10.17,
            "high": 10.26,
            "low": 9.88,
            "close": 9.96,
            "adjclose": 9.71
        },
        "1457965800": {
            "date": "14-03-2016",
            "open": 9.96,
            "high": 10.12,
            "low": 9.85,
            "close": 10.09,
            "adjclose": 9.83
        },
        "1458052200": {
            "date": "15-03-2016",
            "open": 10.07,
            "high": 10.07,
            "low": 9.73,
            "close": 9.87,
            "adjclose": 9.62
        },
        "1458138600": {
            "date": "16-03-2016",
            "open": 9.88,
            "high": 10.11,
            "low": 9.77,
            "close": 10.1,
            "adjclose": 9.84
        },
        "1458225000": {
            "date": "17-03-2016",
            "open": 10.01,
            "high": 10.48,
            "low": 10,
            "close": 10.41,
            "adjclose": 10.15
        },
        "1458311400": {
            "date": "18-03-2016",
            "open": 10.42,
            "high": 11.12,
            "low": 10.42,
            "close": 11.06,
            "adjclose": 10.78
        },
        "1458657000": {
            "date": "22-03-2016",
            "open": 11.12,
            "high": 11.55,
            "low": 11.12,
            "close": 11.5,
            "adjclose": 11.21
        },
        "1458743400": {
            "date": "23-03-2016",
            "open": 11.42,
            "high": 11.53,
            "low": 10.89,
            "close": 11.11,
            "adjclose": 10.83
        },
        "1459175400": {
            "date": "28-03-2016",
            "open": 11.23,
            "high": 11.34,
            "low": 11.14,
            "close": 11.3,
            "adjclose": 11.01
        },
        "1459261800": {
            "date": "29-03-2016",
            "open": 11.34,
            "high": 11.46,
            "low": 11.18,
            "close": 11.29,
            "adjclose": 11
        },
        "1459348200": {
            "date": "30-03-2016",
            "open": 11.36,
            "high": 11.6,
            "low": 11.36,
            "close": 11.51,
            "adjclose": 11.22
        },
        "1459434600": {
            "date": "31-03-2016",
            "open": 11.56,
            "high": 11.74,
            "low": 11.43,
            "close": 11.6,
            "adjclose": 11.31
        },
        "1459521000": {
            "date": "01-04-2016",
            "open": 11.53,
            "high": 11.72,
            "low": 11.37,
            "close": 11.6,
            "adjclose": 11.31
        },
        "1459776600": {
            "date": "04-04-2016",
            "open": 11.56,
            "high": 11.67,
            "low": 11.37,
            "close": 11.51,
            "adjclose": 11.22
        },
        "1459863000": {
            "date": "05-04-2016",
            "open": 11.4,
            "high": 11.65,
            "low": 11.3,
            "close": 11.51,
            "adjclose": 11.22
        },
        "1459949400": {
            "date": "06-04-2016",
            "open": 11.51,
            "high": 11.65,
            "low": 11.4,
            "close": 11.53,
            "adjclose": 11.24
        },
        "1460035800": {
            "date": "07-04-2016",
            "open": 11.46,
            "high": 11.65,
            "low": 11.33,
            "close": 11.41,
            "adjclose": 11.12
        },
        "1460122200": {
            "date": "08-04-2016",
            "open": 11.48,
            "high": 11.58,
            "low": 11.4,
            "close": 11.43,
            "adjclose": 11.14
        },
        "1460381400": {
            "date": "11-04-2016",
            "open": 11.45,
            "high": 11.63,
            "low": 11.43,
            "close": 11.52,
            "adjclose": 11.23
        },
        "1460467800": {
            "date": "12-04-2016",
            "open": 11.5,
            "high": 11.67,
            "low": 11.47,
            "close": 11.64,
            "adjclose": 11.35
        },
        "1460554200": {
            "date": "13-04-2016",
            "open": 11.7,
            "high": 11.81,
            "low": 11.57,
            "close": 11.78,
            "adjclose": 11.48
        },
        "1460640600": {
            "date": "14-04-2016",
            "open": 11.83,
            "high": 11.86,
            "low": 11.62,
            "close": 11.64,
            "adjclose": 11.35
        },
        "1460727000": {
            "date": "15-04-2016",
            "open": 11.61,
            "high": 11.95,
            "low": 11.58,
            "close": 11.87,
            "adjclose": 11.57
        },
        "1460986200": {
            "date": "18-04-2016",
            "open": 11.79,
            "high": 12.01,
            "low": 11.76,
            "close": 11.91,
            "adjclose": 11.61
        },
        "1461072600": {
            "date": "19-04-2016",
            "open": 11.94,
            "high": 12.11,
            "low": 11.84,
            "close": 12.02,
            "adjclose": 11.72
        },
        "1461159000": {
            "date": "20-04-2016",
            "open": 11.95,
            "high": 12.18,
            "low": 11.95,
            "close": 12.08,
            "adjclose": 11.78
        },
        "1461245400": {
            "date": "21-04-2016",
            "open": 12.3,
            "high": 12.52,
            "low": 12,
            "close": 12.07,
            "adjclose": 11.76
        },
        "1461331800": {
            "date": "22-04-2016",
            "open": 12.07,
            "high": 12.32,
            "low": 12.07,
            "close": 12.21,
            "adjclose": 11.91
        },
        "1461591000": {
            "date": "25-04-2016",
            "open": 12.21,
            "high": 12.3,
            "low": 11.85,
            "close": 11.91,
            "adjclose": 11.61
        },
        "1461677400": {
            "date": "26-04-2016",
            "open": 11.93,
            "high": 12.02,
            "low": 11.83,
            "close": 11.91,
            "adjclose": 11.61
        },
        "1461763800": {
            "date": "27-04-2016",
            "open": 11.91,
            "high": 12.07,
            "low": 11.71,
            "close": 12.01,
            "adjclose": 11.71
        },
        "1461850200": {
            "date": "28-04-2016",
            "open": 12,
            "high": 12.28,
            "low": 11.94,
            "close": 12.12,
            "adjclose": 11.81
        },
        "1461936600": {
            "date": "29-04-2016",
            "open": 12.38,
            "high": 12.38,
            "low": 12.04,
            "close": 12.28,
            "adjclose": 11.97
        },
        "1462195800": {
            "date": "02-05-2016",
            "open": 12.39,
            "high": 12.51,
            "low": 12.26,
            "close": 12.31,
            "adjclose": 12
        },
        "1462282200": {
            "date": "03-05-2016",
            "open": 12.3,
            "high": 12.3,
            "low": 11.8,
            "close": 12.02,
            "adjclose": 11.72
        },
        "1462368600": {
            "date": "04-05-2016",
            "open": 11.97,
            "high": 12.13,
            "low": 11.6,
            "close": 11.87,
            "adjclose": 11.57
        },
        "1462455000": {
            "date": "05-05-2016",
            "open": 11.99,
            "high": 11.99,
            "low": 11.64,
            "close": 11.69,
            "adjclose": 11.4
        },
        "1462541400": {
            "date": "06-05-2016",
            "open": 11.72,
            "high": 11.83,
            "low": 11.48,
            "close": 11.72,
            "adjclose": 11.43
        },
        "1462800600": {
            "date": "09-05-2016",
            "open": 11.66,
            "high": 11.8,
            "low": 11.28,
            "close": 11.73,
            "adjclose": 11.43
        },
        "1462887000": {
            "date": "10-05-2016",
            "open": 11.67,
            "high": 12.06,
            "low": 11.67,
            "close": 12.01,
            "adjclose": 11.71
        },
        "1462973400": {
            "date": "11-05-2016",
            "open": 12.03,
            "high": 12.2,
            "low": 11.82,
            "close": 11.86,
            "adjclose": 11.56
        },
        "1463059800": {
            "date": "12-05-2016",
            "open": 11.99,
            "high": 12.1,
            "low": 11.74,
            "close": 11.82,
            "adjclose": 11.52
        },
        "1463146200": {
            "date": "13-05-2016",
            "open": 11.76,
            "high": 11.93,
            "low": 11.49,
            "close": 11.53,
            "adjclose": 11.24
        },
        "1463405400": {
            "date": "16-05-2016",
            "open": 11.61,
            "high": 11.82,
            "low": 11.55,
            "close": 11.59,
            "adjclose": 11.29
        },
        "1463491800": {
            "date": "17-05-2016",
            "open": 11.63,
            "high": 11.82,
            "low": 11.54,
            "close": 11.67,
            "adjclose": 11.38
        },
        "1463578200": {
            "date": "18-05-2016",
            "open": 11.69,
            "high": 11.85,
            "low": 11.44,
            "close": 11.57,
            "adjclose": 11.28
        },
        "1463664600": {
            "date": "19-05-2016",
            "open": 11.54,
            "high": 11.57,
            "low": 11.25,
            "close": 11.33,
            "adjclose": 11.04
        },
        "1463751000": {
            "date": "20-05-2016",
            "open": 11.39,
            "high": 11.53,
            "low": 11.3,
            "close": 11.38,
            "adjclose": 11.1
        },
        "1464010200": {
            "date": "23-05-2016",
            "open": 11.39,
            "high": 11.59,
            "low": 11.28,
            "close": 11.46,
            "adjclose": 11.17
        },
        "1464096600": {
            "date": "24-05-2016",
            "open": 11.49,
            "high": 11.6,
            "low": 11.36,
            "close": 11.53,
            "adjclose": 11.24
        },
        "1464183000": {
            "date": "25-05-2016",
            "open": 11.57,
            "high": 11.78,
            "low": 11.57,
            "close": 11.63,
            "adjclose": 11.33
        },
        "1464269400": {
            "date": "26-05-2016",
            "open": 11.64,
            "high": 11.76,
            "low": 11.56,
            "close": 11.65,
            "adjclose": 11.36
        },
        "1464355800": {
            "date": "27-05-2016",
            "open": 11.63,
            "high": 11.77,
            "low": 11.45,
            "close": 11.52,
            "adjclose": 11.23
        },
        "1464615000": {
            "date": "30-05-2016",
            "open": 11.54,
            "high": 11.57,
            "low": 11.45,
            "close": 11.5,
            "adjclose": 11.21
        },
        "1464701400": {
            "date": "31-05-2016",
            "open": 11.49,
            "high": 11.63,
            "low": 11.21,
            "close": 11.28,
            "adjclose": 10.99
        },
        "1464787800": {
            "date": "01-06-2016",
            "open": 11.3,
            "high": 11.3,
            "low": 11.12,
            "close": 11.23,
            "adjclose": 10.95
        },
        "1464874200": {
            "date": "02-06-2016",
            "open": 11.2,
            "high": 11.37,
            "low": 11.02,
            "close": 11.13,
            "adjclose": 10.84
        },
        "1464960600": {
            "date": "03-06-2016",
            "open": 11.18,
            "high": 11.52,
            "low": 11.02,
            "close": 11.41,
            "adjclose": 11.13
        },
        "1465219800": {
            "date": "06-06-2016",
            "open": 11.49,
            "high": 11.59,
            "low": 11.29,
            "close": 11.37,
            "adjclose": 11.08
        },
        "1465306200": {
            "date": "07-06-2016",
            "open": 11.41,
            "high": 11.7,
            "low": 11.38,
            "close": 11.6,
            "adjclose": 11.3
        },
        "1465392600": {
            "date": "08-06-2016",
            "open": 11.63,
            "high": 12.12,
            "low": 11.63,
            "close": 11.94,
            "adjclose": 11.64
        },
        "1465479000": {
            "date": "09-06-2016",
            "open": 11.9,
            "high": 11.9,
            "low": 11.54,
            "close": 11.58,
            "adjclose": 11.28
        },
        "1465565400": {
            "date": "10-06-2016",
            "open": 11.53,
            "high": 11.54,
            "low": 11.23,
            "close": 11.26,
            "adjclose": 10.98
        },
        "1465824600": {
            "date": "13-06-2016",
            "open": 11.24,
            "high": 11.27,
            "low": 11.06,
            "close": 11.13,
            "adjclose": 10.84
        },
        "1465911000": {
            "date": "14-06-2016",
            "open": 11.13,
            "high": 11.22,
            "low": 10.78,
            "close": 10.8,
            "adjclose": 10.53
        },
        "1465997400": {
            "date": "15-06-2016",
            "open": 10.85,
            "high": 11.24,
            "low": 10.85,
            "close": 11.15,
            "adjclose": 10.87
        },
        "1466083800": {
            "date": "16-06-2016",
            "open": 11.05,
            "high": 11.32,
            "low": 10.95,
            "close": 11.27,
            "adjclose": 10.98
        },
        "1466170200": {
            "date": "17-06-2016",
            "open": 11.35,
            "high": 11.52,
            "low": 11.33,
            "close": 11.5,
            "adjclose": 11.21
        },
        "1466429400": {
            "date": "20-06-2016",
            "open": 11.62,
            "high": 11.88,
            "low": 11.62,
            "close": 11.73,
            "adjclose": 11.43
        },
        "1466515800": {
            "date": "21-06-2016",
            "open": 11.79,
            "high": 11.82,
            "low": 11.55,
            "close": 11.59,
            "adjclose": 11.29
        },
        "1466602200": {
            "date": "22-06-2016",
            "open": 11.59,
            "high": 11.69,
            "low": 11.53,
            "close": 11.66,
            "adjclose": 11.37
        },
        "1466688600": {
            "date": "23-06-2016",
            "open": 11.78,
            "high": 11.94,
            "low": 11.77,
            "close": 11.89,
            "adjclose": 11.59
        },
        "1466775000": {
            "date": "24-06-2016",
            "open": 10.77,
            "high": 11.18,
            "low": 10.71,
            "close": 10.81,
            "adjclose": 10.53
        },
        "1467034200": {
            "date": "27-06-2016",
            "open": 10.76,
            "high": 10.76,
            "low": 10.14,
            "close": 10.2,
            "adjclose": 9.94
        },
        "1467120600": {
            "date": "28-06-2016",
            "open": 10.38,
            "high": 10.51,
            "low": 10.19,
            "close": 10.28,
            "adjclose": 10.02
        },
        "1467207000": {
            "date": "29-06-2016",
            "open": 10.4,
            "high": 10.72,
            "low": 10.4,
            "close": 10.5,
            "adjclose": 10.23
        },
        "1467293400": {
            "date": "30-06-2016",
            "open": 10.58,
            "high": 10.91,
            "low": 10.36,
            "close": 10.87,
            "adjclose": 10.59
        },
        "1467379800": {
            "date": "01-07-2016",
            "open": 10.88,
            "high": 11.23,
            "low": 10.81,
            "close": 10.88,
            "adjclose": 10.6
        },
        "1467639000": {
            "date": "04-07-2016",
            "open": 10.88,
            "high": 10.88,
            "low": 10.73,
            "close": 10.75,
            "adjclose": 10.48
        },
        "1467725400": {
            "date": "05-07-2016",
            "open": 10.67,
            "high": 10.7,
            "low": 10.45,
            "close": 10.51,
            "adjclose": 10.24
        },
        "1467811800": {
            "date": "06-07-2016",
            "open": 10.47,
            "high": 10.64,
            "low": 10.41,
            "close": 10.6,
            "adjclose": 10.33
        },
        "1467898200": {
            "date": "07-07-2016",
            "open": 10.63,
            "high": 11.03,
            "low": 10.63,
            "close": 10.94,
            "adjclose": 10.67
        },
        "1467984600": {
            "date": "08-07-2016",
            "open": 11.08,
            "high": 11.15,
            "low": 10.95,
            "close": 11.1,
            "adjclose": 10.82
        },
        "1468243800": {
            "date": "11-07-2016",
            "open": 11.18,
            "high": 11.62,
            "low": 11.15,
            "close": 11.59,
            "adjclose": 11.29
        },
        "1468330200": {
            "date": "12-07-2016",
            "open": 11.65,
            "high": 11.95,
            "low": 11.65,
            "close": 11.92,
            "adjclose": 11.62
        },
        "1468416600": {
            "date": "13-07-2016",
            "open": 11.97,
            "high": 12.01,
            "low": 11.73,
            "close": 11.8,
            "adjclose": 11.5
        },
        "1468503000": {
            "date": "14-07-2016",
            "open": 11.92,
            "high": 11.98,
            "low": 11.84,
            "close": 11.91,
            "adjclose": 11.61
        },
        "1468589400": {
            "date": "15-07-2016",
            "open": 11.92,
            "high": 12.03,
            "low": 11.91,
            "close": 12,
            "adjclose": 11.7
        },
        "1468848600": {
            "date": "18-07-2016",
            "open": 12.04,
            "high": 12.5,
            "low": 12.03,
            "close": 12.49,
            "adjclose": 12.18
        },
        "1468935000": {
            "date": "19-07-2016",
            "open": 12.38,
            "high": 12.46,
            "low": 12.02,
            "close": 12.04,
            "adjclose": 11.73
        },
        "1469021400": {
            "date": "20-07-2016",
            "open": 12.13,
            "high": 12.43,
            "low": 11.99,
            "close": 12.36,
            "adjclose": 12.04
        },
        "1469107800": {
            "date": "21-07-2016",
            "open": 12.36,
            "high": 12.45,
            "low": 12.12,
            "close": 12.13,
            "adjclose": 11.83
        },
        "1469194200": {
            "date": "22-07-2016",
            "open": 12.23,
            "high": 12.31,
            "low": 12.13,
            "close": 12.26,
            "adjclose": 11.95
        },
        "1469453400": {
            "date": "25-07-2016",
            "open": 12.23,
            "high": 12.34,
            "low": 12.16,
            "close": 12.3,
            "adjclose": 11.99
        },
        "1469539800": {
            "date": "26-07-2016",
            "open": 12.33,
            "high": 12.57,
            "low": 12.33,
            "close": 12.53,
            "adjclose": 12.21
        },
        "1469626200": {
            "date": "27-07-2016",
            "open": 12.73,
            "high": 13.55,
            "low": 12.72,
            "close": 12.84,
            "adjclose": 12.51
        },
        "1469712600": {
            "date": "28-07-2016",
            "open": 12.85,
            "high": 13.54,
            "low": 12.84,
            "close": 13.49,
            "adjclose": 13.15
        },
        "1469799000": {
            "date": "29-07-2016",
            "open": 13.46,
            "high": 13.78,
            "low": 13.31,
            "close": 13.74,
            "adjclose": 13.39
        },
        "1470058200": {
            "date": "01-08-2016",
            "open": 13.73,
            "high": 13.88,
            "low": 13.59,
            "close": 13.72,
            "adjclose": 13.37
        },
        "1470144600": {
            "date": "02-08-2016",
            "open": 13.72,
            "high": 13.72,
            "low": 13.13,
            "close": 13.41,
            "adjclose": 13.07
        },
        "1470231000": {
            "date": "03-08-2016",
            "open": 13.4,
            "high": 13.66,
            "low": 13.29,
            "close": 13.64,
            "adjclose": 13.3
        },
        "1470317400": {
            "date": "04-08-2016",
            "open": 13.64,
            "high": 13.89,
            "low": 13.63,
            "close": 13.74,
            "adjclose": 13.39
        },
        "1470403800": {
            "date": "05-08-2016",
            "open": 13.79,
            "high": 14.21,
            "low": 13.72,
            "close": 14.15,
            "adjclose": 13.8
        },
        "1470663000": {
            "date": "08-08-2016",
            "open": 14.13,
            "high": 14.35,
            "low": 13.83,
            "close": 14.02,
            "adjclose": 13.67
        },
        "1470749400": {
            "date": "09-08-2016",
            "open": 14.08,
            "high": 14.46,
            "low": 14.03,
            "close": 14.42,
            "adjclose": 14.06
        },
        "1470835800": {
            "date": "10-08-2016",
            "open": 14.36,
            "high": 14.98,
            "low": 14.33,
            "close": 14.9,
            "adjclose": 14.53
        },
        "1470922200": {
            "date": "11-08-2016",
            "open": 14.74,
            "high": 15.28,
            "low": 14.74,
            "close": 15.16,
            "adjclose": 14.78
        },
        "1471008600": {
            "date": "12-08-2016",
            "open": 15.07,
            "high": 15.38,
            "low": 15.07,
            "close": 15.31,
            "adjclose": 14.92
        },
        "1471267800": {
            "date": "15-08-2016",
            "open": 15.38,
            "high": 15.75,
            "low": 15.19,
            "close": 15.43,
            "adjclose": 15.04
        },
        "1471354200": {
            "date": "16-08-2016",
            "open": 15.43,
            "high": 15.5,
            "low": 15.05,
            "close": 15.25,
            "adjclose": 14.86
        },
        "1471440600": {
            "date": "17-08-2016",
            "open": 15.25,
            "high": 15.3,
            "low": 14.99,
            "close": 15.21,
            "adjclose": 14.83
        },
        "1471527000": {
            "date": "18-08-2016",
            "open": 15.23,
            "high": 15.24,
            "low": 15.01,
            "close": 15.12,
            "adjclose": 14.73
        },
        "1471613400": {
            "date": "19-08-2016",
            "open": 15.12,
            "high": 15.26,
            "low": 14.85,
            "close": 15.16,
            "adjclose": 14.78
        },
        "1471872600": {
            "date": "22-08-2016",
            "open": 15.08,
            "high": 15.18,
            "low": 14.98,
            "close": 15.16,
            "adjclose": 14.78
        },
        "1471959000": {
            "date": "23-08-2016",
            "open": 15.21,
            "high": 15.37,
            "low": 14.92,
            "close": 14.97,
            "adjclose": 14.59
        },
        "1472045400": {
            "date": "24-08-2016",
            "open": 14.97,
            "high": 14.97,
            "low": 14.71,
            "close": 14.78,
            "adjclose": 14.41
        },
        "1472131800": {
            "date": "25-08-2016",
            "open": 14.72,
            "high": 14.81,
            "low": 14.22,
            "close": 14.27,
            "adjclose": 13.91
        },
        "1472218200": {
            "date": "26-08-2016",
            "open": 14.27,
            "high": 14.98,
            "low": 14.21,
            "close": 14.93,
            "adjclose": 14.56
        },
        "1472477400": {
            "date": "29-08-2016",
            "open": 14.93,
            "high": 15.15,
            "low": 14.88,
            "close": 15.05,
            "adjclose": 14.67
        },
        "1472563800": {
            "date": "30-08-2016",
            "open": 15.13,
            "high": 15.13,
            "low": 14.78,
            "close": 14.99,
            "adjclose": 14.61
        },
        "1472650200": {
            "date": "31-08-2016",
            "open": 15,
            "high": 15.05,
            "low": 14.68,
            "close": 14.97,
            "adjclose": 14.59
        },
        "1472736600": {
            "date": "01-09-2016",
            "open": 14.98,
            "high": 15.26,
            "low": 14.86,
            "close": 14.88,
            "adjclose": 14.5
        },
        "1472823000": {
            "date": "02-09-2016",
            "open": 14.95,
            "high": 15.24,
            "low": 14.94,
            "close": 15.05,
            "adjclose": 14.67
        },
        "1473082200": {
            "date": "05-09-2016",
            "open": 15.09,
            "high": 15.17,
            "low": 15.07,
            "close": 15.15,
            "adjclose": 14.77
        },
        "1473168600": {
            "date": "06-09-2016",
            "open": 15.18,
            "high": 15.26,
            "low": 14.88,
            "close": 14.99,
            "adjclose": 14.61
        },
        "1473255000": {
            "date": "07-09-2016",
            "open": 14.95,
            "high": 15.11,
            "low": 14.59,
            "close": 14.81,
            "adjclose": 14.43
        },
        "1473341400": {
            "date": "08-09-2016",
            "open": 14.84,
            "high": 14.93,
            "low": 14.63,
            "close": 14.84,
            "adjclose": 14.46
        },
        "1473427800": {
            "date": "09-09-2016",
            "open": 14.83,
            "high": 14.83,
            "low": 13.88,
            "close": 14.23,
            "adjclose": 13.87
        },
        "1473687000": {
            "date": "12-09-2016",
            "open": 14.22,
            "high": 14.6,
            "low": 14.11,
            "close": 14.54,
            "adjclose": 14.17
        },
        "1473773400": {
            "date": "13-09-2016",
            "open": 14.39,
            "high": 14.39,
            "low": 14.05,
            "close": 14.09,
            "adjclose": 13.73
        },
        "1473859800": {
            "date": "14-09-2016",
            "open": 14.1,
            "high": 14.2,
            "low": 13.86,
            "close": 13.94,
            "adjclose": 13.59
        },
        "1473946200": {
            "date": "15-09-2016",
            "open": 13.95,
            "high": 14.08,
            "low": 13.83,
            "close": 14.03,
            "adjclose": 13.67
        },
        "1474291800": {
            "date": "19-09-2016",
            "open": 14,
            "high": 14.14,
            "low": 13.79,
            "close": 13.91,
            "adjclose": 13.56
        },
        "1474378200": {
            "date": "20-09-2016",
            "open": 13.94,
            "high": 14.12,
            "low": 13.83,
            "close": 14.05,
            "adjclose": 13.69
        },
        "1474464600": {
            "date": "21-09-2016",
            "open": 14.13,
            "high": 14.23,
            "low": 13.82,
            "close": 14.16,
            "adjclose": 13.81
        },
        "1474551000": {
            "date": "22-09-2016",
            "open": 14.3,
            "high": 14.75,
            "low": 14.23,
            "close": 14.71,
            "adjclose": 14.34
        },
        "1474637400": {
            "date": "23-09-2016",
            "open": 14.63,
            "high": 14.79,
            "low": 14.52,
            "close": 14.73,
            "adjclose": 14.36
        },
        "1474896600": {
            "date": "26-09-2016",
            "open": 14.61,
            "high": 14.71,
            "low": 14.41,
            "close": 14.49,
            "adjclose": 14.12
        },
        "1474983000": {
            "date": "27-09-2016",
            "open": 14.57,
            "high": 14.86,
            "low": 14.36,
            "close": 14.8,
            "adjclose": 14.42
        },
        "1475069400": {
            "date": "28-09-2016",
            "open": 14.71,
            "high": 15.13,
            "low": 14.63,
            "close": 15.09,
            "adjclose": 14.71
        },
        "1475155800": {
            "date": "29-09-2016",
            "open": 15.09,
            "high": 15.48,
            "low": 15,
            "close": 15.35,
            "adjclose": 14.96
        },
        "1475242200": {
            "date": "30-09-2016",
            "open": 15.38,
            "high": 15.43,
            "low": 14.73,
            "close": 14.77,
            "adjclose": 14.4
        },
        "1475501400": {
            "date": "03-10-2016",
            "open": 14.77,
            "high": 14.88,
            "low": 14.59,
            "close": 14.77,
            "adjclose": 14.4
        },
        "1475587800": {
            "date": "04-10-2016",
            "open": 14.79,
            "high": 14.8,
            "low": 14.57,
            "close": 14.71,
            "adjclose": 14.34
        },
        "1475674200": {
            "date": "05-10-2016",
            "open": 14.69,
            "high": 15.07,
            "low": 14.69,
            "close": 14.94,
            "adjclose": 14.57
        },
        "1475760600": {
            "date": "06-10-2016",
            "open": 14.99,
            "high": 15.14,
            "low": 14.84,
            "close": 15.12,
            "adjclose": 14.73
        },
        "1475847000": {
            "date": "07-10-2016",
            "open": 15.12,
            "high": 15.13,
            "low": 14.82,
            "close": 15.01,
            "adjclose": 14.63
        },
        "1476106200": {
            "date": "10-10-2016",
            "open": 15.07,
            "high": 15.48,
            "low": 14.98,
            "close": 15.4,
            "adjclose": 15.01
        },
        "1476192600": {
            "date": "11-10-2016",
            "open": 15.32,
            "high": 15.63,
            "low": 15.23,
            "close": 15.34,
            "adjclose": 14.95
        },
        "1476279000": {
            "date": "12-10-2016",
            "open": 15.29,
            "high": 15.3,
            "low": 14.94,
            "close": 15.21,
            "adjclose": 14.83
        },
        "1476365400": {
            "date": "13-10-2016",
            "open": 15.14,
            "high": 15.49,
            "low": 14.9,
            "close": 15.46,
            "adjclose": 15.07
        },
        "1476451800": {
            "date": "14-10-2016",
            "open": 15.41,
            "high": 15.63,
            "low": 15.29,
            "close": 15.34,
            "adjclose": 14.95
        },
        "1476711000": {
            "date": "17-10-2016",
            "open": 15.44,
            "high": 15.55,
            "low": 15.29,
            "close": 15.45,
            "adjclose": 15.06
        },
        "1476797400": {
            "date": "18-10-2016",
            "open": 15.58,
            "high": 15.82,
            "low": 15.48,
            "close": 15.67,
            "adjclose": 15.28
        },
        "1476883800": {
            "date": "19-10-2016",
            "open": 15.72,
            "high": 16.01,
            "low": 15.55,
            "close": 15.82,
            "adjclose": 15.42
        },
        "1476970200": {
            "date": "20-10-2016",
            "open": 15.91,
            "high": 16.09,
            "low": 15.69,
            "close": 16.05,
            "adjclose": 15.64
        },
        "1477056600": {
            "date": "21-10-2016",
            "open": 16.1,
            "high": 16.54,
            "low": 16.02,
            "close": 16.28,
            "adjclose": 15.87
        },
        "1477315800": {
            "date": "24-10-2016",
            "open": 16.35,
            "high": 16.39,
            "low": 16.13,
            "close": 16.29,
            "adjclose": 15.88
        },
        "1477402200": {
            "date": "25-10-2016",
            "open": 16.26,
            "high": 16.35,
            "low": 16.14,
            "close": 16.22,
            "adjclose": 15.81
        },
        "1477488600": {
            "date": "26-10-2016",
            "open": 16.28,
            "high": 16.29,
            "low": 16.09,
            "close": 16.23,
            "adjclose": 15.82
        },
        "1477575000": {
            "date": "27-10-2016",
            "open": 16.35,
            "high": 16.51,
            "low": 15.83,
            "close": 16.21,
            "adjclose": 15.8
        },
        "1477661400": {
            "date": "28-10-2016",
            "open": 16.13,
            "high": 16.32,
            "low": 15.7,
            "close": 15.8,
            "adjclose": 15.4
        },
        "1477924200": {
            "date": "31-10-2016",
            "open": 15.82,
            "high": 15.98,
            "low": 15.69,
            "close": 15.73,
            "adjclose": 15.33
        },
        "1478010600": {
            "date": "01-11-2016",
            "open": 15.78,
            "high": 15.93,
            "low": 15.24,
            "close": 15.48,
            "adjclose": 15.09
        },
        "1478183400": {
            "date": "03-11-2016",
            "open": 15.41,
            "high": 15.95,
            "low": 15.41,
            "close": 15.59,
            "adjclose": 15.19
        },
        "1478269800": {
            "date": "04-11-2016",
            "open": 15.58,
            "high": 16.04,
            "low": 15.18,
            "close": 15.22,
            "adjclose": 14.84
        },
        "1478529000": {
            "date": "07-11-2016",
            "open": 15.55,
            "high": 16.16,
            "low": 15.55,
            "close": 16.02,
            "adjclose": 15.61
        },
        "1478615400": {
            "date": "08-11-2016",
            "open": 15.95,
            "high": 16.53,
            "low": 15.95,
            "close": 16.1,
            "adjclose": 15.69
        },
        "1478701800": {
            "date": "09-11-2016",
            "open": 15.29,
            "high": 16.06,
            "low": 14.91,
            "close": 15.73,
            "adjclose": 15.33
        },
        "1478788200": {
            "date": "10-11-2016",
            "open": 15.78,
            "high": 16.39,
            "low": 14.77,
            "close": 14.88,
            "adjclose": 14.51
        },
        "1478874600": {
            "date": "11-11-2016",
            "open": 14.88,
            "high": 15.15,
            "low": 14.55,
            "close": 14.82,
            "adjclose": 14.44
        },
        "1479133800": {
            "date": "14-11-2016",
            "open": 14.93,
            "high": 15.42,
            "low": 14.69,
            "close": 14.82,
            "adjclose": 14.44
        },
        "1479220200": {
            "date": "15-11-2016",
            "open": 14.93,
            "high": 15.21,
            "low": 14.86,
            "close": 14.89,
            "adjclose": 14.52
        },
        "1479306600": {
            "date": "16-11-2016",
            "open": 14.89,
            "high": 15.12,
            "low": 14.66,
            "close": 14.89,
            "adjclose": 14.52
        },
        "1479393000": {
            "date": "17-11-2016",
            "open": 15.06,
            "high": 15.68,
            "low": 14.91,
            "close": 15.62,
            "adjclose": 15.22
        },
        "1479479400": {
            "date": "18-11-2016",
            "open": 15.67,
            "high": 15.81,
            "low": 15.24,
            "close": 15.29,
            "adjclose": 14.9
        },
        "1479825000": {
            "date": "22-11-2016",
            "open": 15.44,
            "high": 15.69,
            "low": 15.25,
            "close": 15.48,
            "adjclose": 15.09
        },
        "1479911400": {
            "date": "23-11-2016",
            "open": 15.56,
            "high": 15.8,
            "low": 15.22,
            "close": 15.63,
            "adjclose": 15.24
        },
        "1479997800": {
            "date": "24-11-2016",
            "open": 15.63,
            "high": 15.69,
            "low": 15.55,
            "close": 15.6,
            "adjclose": 15.2
        },
        "1480084200": {
            "date": "25-11-2016",
            "open": 15.77,
            "high": 16.01,
            "low": 15.58,
            "close": 15.9,
            "adjclose": 15.5
        },
        "1480343400": {
            "date": "28-11-2016",
            "open": 15.88,
            "high": 16.06,
            "low": 15.56,
            "close": 15.61,
            "adjclose": 15.21
        },
        "1480429800": {
            "date": "29-11-2016",
            "open": 15.68,
            "high": 15.82,
            "low": 15.51,
            "close": 15.56,
            "adjclose": 15.16
        },
        "1480516200": {
            "date": "30-11-2016",
            "open": 15.63,
            "high": 15.82,
            "low": 15.31,
            "close": 15.39,
            "adjclose": 15.01
        },
        "1480602600": {
            "date": "01-12-2016",
            "open": 15.41,
            "high": 15.61,
            "low": 15.36,
            "close": 15.39,
            "adjclose": 15.01
        },
        "1480689000": {
            "date": "02-12-2016",
            "open": 15.39,
            "high": 15.63,
            "low": 15.32,
            "close": 15.54,
            "adjclose": 15.15
        },
        "1480948200": {
            "date": "05-12-2016",
            "open": 15.58,
            "high": 15.93,
            "low": 15.54,
            "close": 15.86,
            "adjclose": 15.46
        },
        "1481034600": {
            "date": "06-12-2016",
            "open": 15.91,
            "high": 16.08,
            "low": 15.59,
            "close": 16.05,
            "adjclose": 15.64
        },
        "1481121000": {
            "date": "07-12-2016",
            "open": 16.13,
            "high": 16.65,
            "low": 16.06,
            "close": 16.61,
            "adjclose": 16.19
        },
        "1481207400": {
            "date": "08-12-2016",
            "open": 16.65,
            "high": 17.44,
            "low": 16.65,
            "close": 17.38,
            "adjclose": 16.94
        },
        "1481293800": {
            "date": "09-12-2016",
            "open": 17.38,
            "high": 17.44,
            "low": 16.73,
            "close": 17.23,
            "adjclose": 16.8
        },
        "1481639400": {
            "date": "13-12-2016",
            "open": 17.26,
            "high": 17.36,
            "low": 16.95,
            "close": 17.01,
            "adjclose": 16.58
        },
        "1481725800": {
            "date": "14-12-2016",
            "open": 17.01,
            "high": 17.01,
            "low": 16.24,
            "close": 16.38,
            "adjclose": 15.97
        },
        "1481812200": {
            "date": "15-12-2016",
            "open": 16.37,
            "high": 16.44,
            "low": 15.96,
            "close": 15.99,
            "adjclose": 15.59
        },
        "1481898600": {
            "date": "16-12-2016",
            "open": 15.99,
            "high": 16.11,
            "low": 15.49,
            "close": 15.67,
            "adjclose": 15.28
        },
        "1482157800": {
            "date": "19-12-2016",
            "open": 15.72,
            "high": 15.82,
            "low": 15.53,
            "close": 15.57,
            "adjclose": 15.17
        },
        "1482244200": {
            "date": "20-12-2016",
            "open": 15.57,
            "high": 15.95,
            "low": 15.57,
            "close": 15.86,
            "adjclose": 15.46
        },
        "1482330600": {
            "date": "21-12-2016",
            "open": 15.89,
            "high": 15.95,
            "low": 15.77,
            "close": 15.87,
            "adjclose": 15.46
        },
        "1482417000": {
            "date": "22-12-2016",
            "open": 15.86,
            "high": 15.94,
            "low": 15.35,
            "close": 15.48,
            "adjclose": 15.09
        },
        "1482503400": {
            "date": "23-12-2016",
            "open": 15.48,
            "high": 15.63,
            "low": 15.34,
            "close": 15.43,
            "adjclose": 15.04
        },
        "1482762600": {
            "date": "26-12-2016",
            "open": 15.39,
            "high": 15.48,
            "low": 15.26,
            "close": 15.29,
            "adjclose": 14.9
        },
        "1482849000": {
            "date": "27-12-2016",
            "open": 15.34,
            "high": 16.06,
            "low": 15.34,
            "close": 16.02,
            "adjclose": 15.61
        },
        "1482935400": {
            "date": "28-12-2016",
            "open": 16.18,
            "high": 16.19,
            "low": 15.87,
            "close": 15.94,
            "adjclose": 15.54
        },
        "1483021800": {
            "date": "29-12-2016",
            "open": 15.95,
            "high": 16.09,
            "low": 15.7,
            "close": 15.79,
            "adjclose": 15.39
        },
        "1483108200": {
            "date": "30-12-2016",
            "open": 15.81,
            "high": 15.96,
            "low": 15.81,
            "close": 15.9,
            "adjclose": 15.5
        },
        "1483367400": {
            "date": "02-01-2017",
            "open": 15.91,
            "high": 15.99,
            "low": 15.76,
            "close": 15.9,
            "adjclose": 15.5
        },
        "1483453800": {
            "date": "03-01-2017",
            "open": 15.97,
            "high": 16.24,
            "low": 15.83,
            "close": 15.9,
            "adjclose": 15.5
        },
        "1483540200": {
            "date": "04-01-2017",
            "open": 15.96,
            "high": 16.39,
            "low": 15.92,
            "close": 16.35,
            "adjclose": 15.93
        },
        "1483626600": {
            "date": "05-01-2017",
            "open": 16.4,
            "high": 16.49,
            "low": 16.3,
            "close": 16.37,
            "adjclose": 15.95
        },
        "1483713000": {
            "date": "06-01-2017",
            "open": 16.41,
            "high": 16.44,
            "low": 16.26,
            "close": 16.37,
            "adjclose": 15.95
        },
        "1483972200": {
            "date": "09-01-2017",
            "open": 16.37,
            "high": 16.37,
            "low": 16.1,
            "close": 16.19,
            "adjclose": 15.78
        },
        "1484058600": {
            "date": "10-01-2017",
            "open": 16.12,
            "high": 16.33,
            "low": 16.12,
            "close": 16.26,
            "adjclose": 15.85
        },
        "1484145000": {
            "date": "11-01-2017",
            "open": 16.18,
            "high": 16.39,
            "low": 16.14,
            "close": 16.37,
            "adjclose": 15.95
        },
        "1484231400": {
            "date": "12-01-2017",
            "open": 16.25,
            "high": 16.76,
            "low": 16.16,
            "close": 16.71,
            "adjclose": 16.29
        },
        "1484317800": {
            "date": "13-01-2017",
            "open": 16.83,
            "high": 16.83,
            "low": 16.4,
            "close": 16.43,
            "adjclose": 16.02
        },
        "1484577000": {
            "date": "16-01-2017",
            "open": 16.43,
            "high": 16.43,
            "low": 16.13,
            "close": 16.14,
            "adjclose": 15.74
        },
        "1484663400": {
            "date": "17-01-2017",
            "open": 16.2,
            "high": 17.15,
            "low": 16.2,
            "close": 17.06,
            "adjclose": 16.63
        },
        "1484749800": {
            "date": "18-01-2017",
            "open": 17.13,
            "high": 17.63,
            "low": 17.13,
            "close": 17.44,
            "adjclose": 17
        },
        "1484836200": {
            "date": "19-01-2017",
            "open": 17.48,
            "high": 17.59,
            "low": 17.26,
            "close": 17.41,
            "adjclose": 16.97
        },
        "1484922600": {
            "date": "20-01-2017",
            "open": 17.38,
            "high": 18.4,
            "low": 17.36,
            "close": 18.19,
            "adjclose": 17.73
        },
        "1485181800": {
            "date": "23-01-2017",
            "open": 18,
            "high": 18.32,
            "low": 17.75,
            "close": 18.05,
            "adjclose": 17.59
        },
        "1485268200": {
            "date": "24-01-2017",
            "open": 18.17,
            "high": 18.98,
            "low": 18.17,
            "close": 18.79,
            "adjclose": 18.31
        },
        "1485354600": {
            "date": "25-01-2017",
            "open": 19.01,
            "high": 19.27,
            "low": 18.58,
            "close": 19.12,
            "adjclose": 18.63
        },
        "1485441000": {
            "date": "26-01-2017",
            "open": 19.04,
            "high": 19.12,
            "low": 18.51,
            "close": 18.58,
            "adjclose": 18.11
        },
        "1485527400": {
            "date": "27-01-2017",
            "open": 18.58,
            "high": 18.89,
            "low": 18.36,
            "close": 18.62,
            "adjclose": 18.15
        },
        "1485786600": {
            "date": "30-01-2017",
            "open": 18.55,
            "high": 18.56,
            "low": 18.2,
            "close": 18.46,
            "adjclose": 18
        },
        "1485873000": {
            "date": "31-01-2017",
            "open": 18.49,
            "high": 18.78,
            "low": 18.45,
            "close": 18.52,
            "adjclose": 18.05
        },
        "1485959400": {
            "date": "01-02-2017",
            "open": 18.65,
            "high": 18.65,
            "low": 18.12,
            "close": 18.16,
            "adjclose": 17.7
        },
        "1486045800": {
            "date": "02-02-2017",
            "open": 18.17,
            "high": 18.4,
            "low": 18.08,
            "close": 18.19,
            "adjclose": 17.73
        },
        "1486132200": {
            "date": "03-02-2017",
            "open": 18.36,
            "high": 18.37,
            "low": 17.9,
            "close": 18.05,
            "adjclose": 17.59
        },
        "1486477800": {
            "date": "07-02-2017",
            "open": 17.97,
            "high": 17.98,
            "low": 17.31,
            "close": 17.37,
            "adjclose": 16.93
        },
        "1486564200": {
            "date": "08-02-2017",
            "open": 17.37,
            "high": 17.4,
            "low": 17.05,
            "close": 17.1,
            "adjclose": 16.66
        },
        "1486650600": {
            "date": "09-02-2017",
            "open": 17.09,
            "high": 17.53,
            "low": 16.93,
            "close": 17.43,
            "adjclose": 16.99
        },
        "1486737000": {
            "date": "10-02-2017",
            "open": 17.4,
            "high": 17.78,
            "low": 17.4,
            "close": 17.57,
            "adjclose": 17.12
        },
        "1486996200": {
            "date": "13-02-2017",
            "open": 17.66,
            "high": 17.92,
            "low": 17.41,
            "close": 17.65,
            "adjclose": 17.21
        },
        "1487082600": {
            "date": "14-02-2017",
            "open": 17.75,
            "high": 17.75,
            "low": 17.38,
            "close": 17.59,
            "adjclose": 17.14
        },
        "1487169000": {
            "date": "15-02-2017",
            "open": 17.52,
            "high": 17.67,
            "low": 17.36,
            "close": 17.38,
            "adjclose": 16.95
        },
        "1487255400": {
            "date": "16-02-2017",
            "open": 17.34,
            "high": 17.49,
            "low": 16.94,
            "close": 17,
            "adjclose": 16.57
        },
        "1487341800": {
            "date": "17-02-2017",
            "open": 17.02,
            "high": 17.22,
            "low": 16.94,
            "close": 16.99,
            "adjclose": 16.56
        },
        "1487601000": {
            "date": "20-02-2017",
            "open": 17.07,
            "high": 17.16,
            "low": 16.97,
            "close": 17.02,
            "adjclose": 16.59
        },
        "1487687400": {
            "date": "21-02-2017",
            "open": 17.07,
            "high": 17.36,
            "low": 17,
            "close": 17.31,
            "adjclose": 16.87
        },
        "1487773800": {
            "date": "22-02-2017",
            "open": 17.24,
            "high": 17.31,
            "low": 16.8,
            "close": 16.83,
            "adjclose": 16.4
        },
        "1487860200": {
            "date": "23-02-2017",
            "open": 16.97,
            "high": 16.97,
            "low": 16.26,
            "close": 16.38,
            "adjclose": 15.96
        },
        "1487946600": {
            "date": "24-02-2017",
            "open": 16.35,
            "high": 16.36,
            "low": 16.05,
            "close": 16.28,
            "adjclose": 15.87
        },
        "1488205800": {
            "date": "27-02-2017",
            "open": 16.26,
            "high": 16.88,
            "low": 16.13,
            "close": 16.81,
            "adjclose": 16.38
        },
        "1488292200": {
            "date": "28-02-2017",
            "open": 16.88,
            "high": 16.89,
            "low": 16.29,
            "close": 16.36,
            "adjclose": 15.94
        },
        "1488378600": {
            "date": "01-03-2017",
            "open": 16.55,
            "high": 17.4,
            "low": 16.55,
            "close": 17.37,
            "adjclose": 16.93
        },
        "1488465000": {
            "date": "02-03-2017",
            "open": 17.28,
            "high": 17.39,
            "low": 16.58,
            "close": 16.63,
            "adjclose": 16.21
        },
        "1488551400": {
            "date": "03-03-2017",
            "open": 16.76,
            "high": 17.11,
            "low": 16.55,
            "close": 16.59,
            "adjclose": 16.17
        },
        "1488810600": {
            "date": "06-03-2017",
            "open": 16.56,
            "high": 17.05,
            "low": 16.43,
            "close": 17.01,
            "adjclose": 16.58
        },
        "1488897000": {
            "date": "07-03-2017",
            "open": 16.97,
            "high": 16.97,
            "low": 16.58,
            "close": 16.66,
            "adjclose": 16.24
        },
        "1488983400": {
            "date": "08-03-2017",
            "open": 16.73,
            "high": 16.88,
            "low": 16.44,
            "close": 16.46,
            "adjclose": 16.05
        },
        "1489069800": {
            "date": "09-03-2017",
            "open": 16.5,
            "high": 16.53,
            "low": 16.22,
            "close": 16.5,
            "adjclose": 16.08
        },
        "1489156200": {
            "date": "10-03-2017",
            "open": 16.55,
            "high": 16.57,
            "low": 16.23,
            "close": 16.28,
            "adjclose": 15.87
        },
        "1489415400": {
            "date": "13-03-2017",
            "open": 16.35,
            "high": 16.47,
            "low": 16.11,
            "close": 16.41,
            "adjclose": 16
        },
        "1489501800": {
            "date": "14-03-2017",
            "open": 16.47,
            "high": 16.47,
            "low": 16.03,
            "close": 16.18,
            "adjclose": 15.77
        },
        "1489588200": {
            "date": "15-03-2017",
            "open": 16.1,
            "high": 16.54,
            "low": 16.1,
            "close": 16.46,
            "adjclose": 16.05
        },
        "1489674600": {
            "date": "16-03-2017",
            "open": 16.54,
            "high": 16.85,
            "low": 16.24,
            "close": 16.83,
            "adjclose": 16.4
        },
        "1489761000": {
            "date": "17-03-2017",
            "open": 16.82,
            "high": 16.89,
            "low": 16.63,
            "close": 16.74,
            "adjclose": 16.32
        },
        "1490106600": {
            "date": "21-03-2017",
            "open": 16.77,
            "high": 16.77,
            "low": 16.22,
            "close": 16.26,
            "adjclose": 15.85
        },
        "1490193000": {
            "date": "22-03-2017",
            "open": 16.37,
            "high": 16.38,
            "low": 16.09,
            "close": 16.25,
            "adjclose": 15.84
        },
        "1490279400": {
            "date": "23-03-2017",
            "open": 16.25,
            "high": 16.37,
            "low": 16.13,
            "close": 16.16,
            "adjclose": 15.76
        },
        "1490365800": {
            "date": "24-03-2017",
            "open": 16.24,
            "high": 16.32,
            "low": 15.83,
            "close": 16.1,
            "adjclose": 15.69
        },
        "1490625000": {
            "date": "27-03-2017",
            "open": 16.09,
            "high": 16.19,
            "low": 15.87,
            "close": 16.15,
            "adjclose": 15.75
        },
        "1490711400": {
            "date": "28-03-2017",
            "open": 16.12,
            "high": 16.36,
            "low": 16.01,
            "close": 16.08,
            "adjclose": 15.67
        },
        "1490797800": {
            "date": "29-03-2017",
            "open": 16.02,
            "high": 16.12,
            "low": 15.85,
            "close": 16.09,
            "adjclose": 15.68
        },
        "1490884200": {
            "date": "30-03-2017",
            "open": 16.11,
            "high": 16.21,
            "low": 15.88,
            "close": 15.92,
            "adjclose": 15.52
        },
        "1490970600": {
            "date": "31-03-2017",
            "open": 15.96,
            "high": 16.44,
            "low": 15.95,
            "close": 16.3,
            "adjclose": 15.89
        },
        "1491226200": {
            "date": "03-04-2017",
            "open": 16.36,
            "high": 16.43,
            "low": 16.15,
            "close": 16.29,
            "adjclose": 15.88
        },
        "1491312600": {
            "date": "04-04-2017",
            "open": 16.38,
            "high": 17.07,
            "low": 16.38,
            "close": 16.9,
            "adjclose": 16.48
        },
        "1491399000": {
            "date": "05-04-2017",
            "open": 16.97,
            "high": 17.26,
            "low": 16.75,
            "close": 16.81,
            "adjclose": 16.38
        },
        "1491485400": {
            "date": "06-04-2017",
            "open": 16.88,
            "high": 17.09,
            "low": 16.66,
            "close": 16.75,
            "adjclose": 16.33
        },
        "1491571800": {
            "date": "07-04-2017",
            "open": 16.75,
            "high": 16.92,
            "low": 16.63,
            "close": 16.8,
            "adjclose": 16.37
        },
        "1491831000": {
            "date": "10-04-2017",
            "open": 16.86,
            "high": 16.88,
            "low": 16.6,
            "close": 16.78,
            "adjclose": 16.36
        },
        "1491917400": {
            "date": "11-04-2017",
            "open": 16.83,
            "high": 16.84,
            "low": 16.44,
            "close": 16.66,
            "adjclose": 16.24
        },
        "1492003800": {
            "date": "12-04-2017",
            "open": 16.68,
            "high": 16.68,
            "low": 16.17,
            "close": 16.22,
            "adjclose": 15.81
        },
        "1492435800": {
            "date": "17-04-2017",
            "open": 16.02,
            "high": 16.22,
            "low": 15.82,
            "close": 16.06,
            "adjclose": 15.65
        },
        "1492522200": {
            "date": "18-04-2017",
            "open": 16.13,
            "high": 16.13,
            "low": 15.78,
            "close": 15.9,
            "adjclose": 15.5
        },
        "1492608600": {
            "date": "19-04-2017",
            "open": 15.98,
            "high": 16.14,
            "low": 15.75,
            "close": 15.77,
            "adjclose": 15.37
        },
        "1492695000": {
            "date": "20-04-2017",
            "open": 15.91,
            "high": 16.06,
            "low": 15.71,
            "close": 16.04,
            "adjclose": 15.63
        },
        "1492781400": {
            "date": "21-04-2017",
            "open": 16.02,
            "high": 16.11,
            "low": 15.93,
            "close": 16.02,
            "adjclose": 15.61
        },
        "1493040600": {
            "date": "24-04-2017",
            "open": 16.17,
            "high": 16.25,
            "low": 15.99,
            "close": 16.2,
            "adjclose": 15.79
        },
        "1493127000": {
            "date": "25-04-2017",
            "open": 16.28,
            "high": 16.69,
            "low": 16.24,
            "close": 16.67,
            "adjclose": 16.25
        },
        "1493213400": {
            "date": "26-04-2017",
            "open": 16.68,
            "high": 16.82,
            "low": 16.35,
            "close": 16.79,
            "adjclose": 16.36
        },
        "1493299800": {
            "date": "27-04-2017",
            "open": 16.83,
            "high": 17.02,
            "low": 16.59,
            "close": 16.93,
            "adjclose": 16.51
        },
        "1493386200": {
            "date": "28-04-2017",
            "open": 16.86,
            "high": 16.99,
            "low": 16.62,
            "close": 16.65,
            "adjclose": 16.23
        },
        "1493731800": {
            "date": "02-05-2017",
            "open": 16.73,
            "high": 17.2,
            "low": 16.68,
            "close": 16.74,
            "adjclose": 16.32
        },
        "1493818200": {
            "date": "03-05-2017",
            "open": 17.29,
            "high": 17.29,
            "low": 16.54,
            "close": 16.56,
            "adjclose": 16.14
        },
        "1493904600": {
            "date": "04-05-2017",
            "open": 16.63,
            "high": 16.85,
            "low": 16.25,
            "close": 16.39,
            "adjclose": 15.98
        },
        "1493991000": {
            "date": "05-05-2017",
            "open": 16.43,
            "high": 16.77,
            "low": 16.41,
            "close": 16.72,
            "adjclose": 16.3
        },
        "1494250200": {
            "date": "08-05-2017",
            "open": 16.76,
            "high": 16.79,
            "low": 16.56,
            "close": 16.64,
            "adjclose": 16.22
        },
        "1494336600": {
            "date": "09-05-2017",
            "open": 16.63,
            "high": 16.83,
            "low": 16.54,
            "close": 16.79,
            "adjclose": 16.37
        },
        "1494423000": {
            "date": "10-05-2017",
            "open": 16.83,
            "high": 16.95,
            "low": 16.69,
            "close": 16.74,
            "adjclose": 16.32
        },
        "1494509400": {
            "date": "11-05-2017",
            "open": 16.67,
            "high": 16.79,
            "low": 16.33,
            "close": 16.41,
            "adjclose": 16
        },
        "1494595800": {
            "date": "12-05-2017",
            "open": 16.41,
            "high": 16.42,
            "low": 16.24,
            "close": 16.31,
            "adjclose": 15.9
        },
        "1494855000": {
            "date": "15-05-2017",
            "open": 16.41,
            "high": 16.55,
            "low": 16.31,
            "close": 16.38,
            "adjclose": 15.97
        },
        "1494941400": {
            "date": "16-05-2017",
            "open": 16.38,
            "high": 16.47,
            "low": 16.11,
            "close": 16.18,
            "adjclose": 15.77
        },
        "1495027800": {
            "date": "17-05-2017",
            "open": 16.11,
            "high": 16.18,
            "low": 15.8,
            "close": 15.82,
            "adjclose": 15.42
        },
        "1495114200": {
            "date": "18-05-2017",
            "open": 15.8,
            "high": 15.8,
            "low": 15.37,
            "close": 15.58,
            "adjclose": 15.19
        },
        "1495200600": {
            "date": "19-05-2017",
            "open": 15.6,
            "high": 16.14,
            "low": 15.56,
            "close": 15.96,
            "adjclose": 15.56
        },
        "1495459800": {
            "date": "22-05-2017",
            "open": 15.96,
            "high": 16.04,
            "low": 15.75,
            "close": 15.8,
            "adjclose": 15.4
        },
        "1495546200": {
            "date": "23-05-2017",
            "open": 15.82,
            "high": 15.98,
            "low": 15.69,
            "close": 15.94,
            "adjclose": 15.54
        },
        "1495632600": {
            "date": "24-05-2017",
            "open": 15.95,
            "high": 15.96,
            "low": 15.65,
            "close": 15.68,
            "adjclose": 15.28
        },
        "1495719000": {
            "date": "25-05-2017",
            "open": 15.7,
            "high": 15.7,
            "low": 15.36,
            "close": 15.52,
            "adjclose": 15.13
        },
        "1495805400": {
            "date": "26-05-2017",
            "open": 15.52,
            "high": 15.61,
            "low": 15.36,
            "close": 15.55,
            "adjclose": 15.16
        },
        "1496064600": {
            "date": "29-05-2017",
            "open": 15.55,
            "high": 15.63,
            "low": 15.47,
            "close": 15.52,
            "adjclose": 15.13
        },
        "1496151000": {
            "date": "30-05-2017",
            "open": 15.48,
            "high": 15.95,
            "low": 15.48,
            "close": 15.71,
            "adjclose": 15.31
        },
        "1496237400": {
            "date": "31-05-2017",
            "open": 15.76,
            "high": 15.88,
            "low": 15.38,
            "close": 15.42,
            "adjclose": 15.03
        },
        "1496323800": {
            "date": "01-06-2017",
            "open": 15.47,
            "high": 15.75,
            "low": 15.45,
            "close": 15.71,
            "adjclose": 15.31
        },
        "1496410200": {
            "date": "02-06-2017",
            "open": 15.65,
            "high": 15.96,
            "low": 15.65,
            "close": 15.94,
            "adjclose": 15.54
        },
        "1496669400": {
            "date": "05-06-2017",
            "open": 15.94,
            "high": 15.94,
            "low": 15.61,
            "close": 15.89,
            "adjclose": 15.49
        },
        "1496755800": {
            "date": "06-06-2017",
            "open": 15.88,
            "high": 16.24,
            "low": 15.72,
            "close": 16.12,
            "adjclose": 15.71
        },
        "1496842200": {
            "date": "07-06-2017",
            "open": 16.13,
            "high": 16.25,
            "low": 15.96,
            "close": 16.14,
            "adjclose": 15.73
        },
        "1496928600": {
            "date": "08-06-2017",
            "open": 16.17,
            "high": 16.55,
            "low": 16.11,
            "close": 16.39,
            "adjclose": 15.98
        },
        "1497015000": {
            "date": "09-06-2017",
            "open": 16.44,
            "high": 16.89,
            "low": 16.44,
            "close": 16.8,
            "adjclose": 16.38
        },
        "1497274200": {
            "date": "12-06-2017",
            "open": 16.73,
            "high": 16.88,
            "low": 16.61,
            "close": 16.84,
            "adjclose": 16.41
        },
        "1497360600": {
            "date": "13-06-2017",
            "open": 16.89,
            "high": 16.89,
            "low": 16.61,
            "close": 16.73,
            "adjclose": 16.31
        },
        "1497447000": {
            "date": "14-06-2017",
            "open": 16.64,
            "high": 16.92,
            "low": 16.57,
            "close": 16.73,
            "adjclose": 16.31
        },
        "1497533400": {
            "date": "15-06-2017",
            "open": 16.7,
            "high": 16.73,
            "low": 16.5,
            "close": 16.53,
            "adjclose": 16.11
        },
        "1497619800": {
            "date": "16-06-2017",
            "open": 16.51,
            "high": 16.77,
            "low": 16.37,
            "close": 16.6,
            "adjclose": 16.18
        },
        "1497879000": {
            "date": "19-06-2017",
            "open": 16.63,
            "high": 16.81,
            "low": 16.11,
            "close": 16.67,
            "adjclose": 16.25
        },
        "1497965400": {
            "date": "20-06-2017",
            "open": 16.71,
            "high": 16.84,
            "low": 16.47,
            "close": 16.54,
            "adjclose": 16.12
        },
        "1498051800": {
            "date": "21-06-2017",
            "open": 16.5,
            "high": 16.75,
            "low": 16.31,
            "close": 16.68,
            "adjclose": 16.26
        },
        "1498138200": {
            "date": "22-06-2017",
            "open": 16.68,
            "high": 16.7,
            "low": 16.47,
            "close": 16.62,
            "adjclose": 16.2
        },
        "1498224600": {
            "date": "23-06-2017",
            "open": 16.62,
            "high": 16.65,
            "low": 16.45,
            "close": 16.53,
            "adjclose": 16.11
        },
        "1498483800": {
            "date": "26-06-2017",
            "open": 16.45,
            "high": 16.53,
            "low": 16.34,
            "close": 16.44,
            "adjclose": 16.02
        },
        "1498570200": {
            "date": "27-06-2017",
            "open": 16.39,
            "high": 16.52,
            "low": 16.35,
            "close": 16.5,
            "adjclose": 16.08
        },
        "1498656600": {
            "date": "28-06-2017",
            "open": 16.55,
            "high": 16.85,
            "low": 16.47,
            "close": 16.81,
            "adjclose": 16.39
        },
        "1498743000": {
            "date": "29-06-2017",
            "open": 16.7,
            "high": 16.95,
            "low": 16.67,
            "close": 16.78,
            "adjclose": 16.36
        },
        "1498829400": {
            "date": "30-06-2017",
            "open": 16.79,
            "high": 17.09,
            "low": 16.66,
            "close": 17.05,
            "adjclose": 16.62
        },
        "1499088600": {
            "date": "03-07-2017",
            "open": 17.09,
            "high": 17.61,
            "low": 17.08,
            "close": 17.51,
            "adjclose": 17.07
        },
        "1499175000": {
            "date": "04-07-2017",
            "open": 17.46,
            "high": 17.6,
            "low": 17.31,
            "close": 17.57,
            "adjclose": 17.13
        },
        "1499261400": {
            "date": "05-07-2017",
            "open": 17.6,
            "high": 17.98,
            "low": 17.57,
            "close": 17.89,
            "adjclose": 17.44
        },
        "1499347800": {
            "date": "06-07-2017",
            "open": 17.79,
            "high": 17.85,
            "low": 17.66,
            "close": 17.7,
            "adjclose": 17.25
        },
        "1499434200": {
            "date": "07-07-2017",
            "open": 17.63,
            "high": 17.97,
            "low": 17.57,
            "close": 17.8,
            "adjclose": 17.35
        },
        "1499693400": {
            "date": "10-07-2017",
            "open": 17.8,
            "high": 18.14,
            "low": 17.67,
            "close": 18.04,
            "adjclose": 17.58
        },
        "1499779800": {
            "date": "11-07-2017",
            "open": 17.98,
            "high": 18.23,
            "low": 17.97,
            "close": 18.16,
            "adjclose": 17.7
        },
        "1499866200": {
            "date": "12-07-2017",
            "open": 18.19,
            "high": 18.39,
            "low": 18.13,
            "close": 18.26,
            "adjclose": 17.8
        },
        "1499952600": {
            "date": "13-07-2017",
            "open": 18.21,
            "high": 18.21,
            "low": 17.89,
            "close": 17.98,
            "adjclose": 17.53
        },
        "1500039000": {
            "date": "14-07-2017",
            "open": 17.97,
            "high": 18.04,
            "low": 17.77,
            "close": 18,
            "adjclose": 17.55
        },
        "1500298200": {
            "date": "17-07-2017",
            "open": 17.85,
            "high": 17.85,
            "low": 17.42,
            "close": 17.57,
            "adjclose": 17.13
        },
        "1500384600": {
            "date": "18-07-2017",
            "open": 17.57,
            "high": 17.57,
            "low": 17.01,
            "close": 17.17,
            "adjclose": 16.74
        },
        "1500471000": {
            "date": "19-07-2017",
            "open": 17.15,
            "high": 17.3,
            "low": 17.08,
            "close": 17.2,
            "adjclose": 16.77
        },
        "1500557400": {
            "date": "20-07-2017",
            "open": 17.29,
            "high": 17.51,
            "low": 17.23,
            "close": 17.46,
            "adjclose": 17.02
        },
        "1500643800": {
            "date": "21-07-2017",
            "open": 17.47,
            "high": 17.93,
            "low": 17.32,
            "close": 17.91,
            "adjclose": 17.46
        },
        "1500903000": {
            "date": "24-07-2017",
            "open": 17.93,
            "high": 17.94,
            "low": 17.71,
            "close": 17.9,
            "adjclose": 17.45
        },
        "1500989400": {
            "date": "25-07-2017",
            "open": 17.85,
            "high": 17.98,
            "low": 17.82,
            "close": 17.93,
            "adjclose": 17.48
        },
        "1501075800": {
            "date": "26-07-2017",
            "open": 17.5,
            "high": 17.72,
            "low": 17.12,
            "close": 17.3,
            "adjclose": 16.86
        },
        "1501162200": {
            "date": "27-07-2017",
            "open": 17.21,
            "high": 17.4,
            "low": 16.96,
            "close": 17.02,
            "adjclose": 16.59
        },
        "1501248600": {
            "date": "28-07-2017",
            "open": 17,
            "high": 17.17,
            "low": 16.87,
            "close": 17.15,
            "adjclose": 16.72
        },
        "1501507800": {
            "date": "31-07-2017",
            "open": 17.01,
            "high": 17.3,
            "low": 17.01,
            "close": 17.2,
            "adjclose": 16.77
        },
        "1501594200": {
            "date": "01-08-2017",
            "open": 17.33,
            "high": 17.66,
            "low": 17.28,
            "close": 17.61,
            "adjclose": 17.17
        },
        "1501680600": {
            "date": "02-08-2017",
            "open": 17.58,
            "high": 17.8,
            "low": 17.47,
            "close": 17.52,
            "adjclose": 17.08
        },
        "1501767000": {
            "date": "03-08-2017",
            "open": 17.5,
            "high": 17.63,
            "low": 17.23,
            "close": 17.3,
            "adjclose": 16.86
        },
        "1501853400": {
            "date": "04-08-2017",
            "open": 17.38,
            "high": 17.53,
            "low": 17.2,
            "close": 17.5,
            "adjclose": 17.06
        },
        "1502112600": {
            "date": "07-08-2017",
            "open": 17.48,
            "high": 17.58,
            "low": 17.39,
            "close": 17.43,
            "adjclose": 16.99
        },
        "1502199000": {
            "date": "08-08-2017",
            "open": 17.37,
            "high": 17.47,
            "low": 17.22,
            "close": 17.25,
            "adjclose": 16.81
        },
        "1502285400": {
            "date": "09-08-2017",
            "open": 17.33,
            "high": 17.33,
            "low": 17.1,
            "close": 17.17,
            "adjclose": 16.74
        },
        "1502371800": {
            "date": "10-08-2017",
            "open": 17.11,
            "high": 17.11,
            "low": 16.57,
            "close": 16.69,
            "adjclose": 16.27
        },
        "1502458200": {
            "date": "11-08-2017",
            "open": 16.7,
            "high": 16.81,
            "low": 16.44,
            "close": 16.5,
            "adjclose": 16.08
        },
        "1502717400": {
            "date": "14-08-2017",
            "open": 16.61,
            "high": 16.73,
            "low": 16.52,
            "close": 16.61,
            "adjclose": 16.19
        },
        "1502803800": {
            "date": "15-08-2017",
            "open": 16.69,
            "high": 16.77,
            "low": 16.49,
            "close": 16.55,
            "adjclose": 16.13
        },
        "1502890200": {
            "date": "16-08-2017",
            "open": 16.56,
            "high": 16.68,
            "low": 16.42,
            "close": 16.52,
            "adjclose": 16.1
        },
        "1502976600": {
            "date": "17-08-2017",
            "open": 16.52,
            "high": 16.58,
            "low": 16.32,
            "close": 16.42,
            "adjclose": 16.01
        },
        "1503063000": {
            "date": "18-08-2017",
            "open": 16.49,
            "high": 16.63,
            "low": 16.3,
            "close": 16.37,
            "adjclose": 15.96
        },
        "1503322200": {
            "date": "21-08-2017",
            "open": 16.36,
            "high": 16.41,
            "low": 16.19,
            "close": 16.24,
            "adjclose": 15.83
        },
        "1503408600": {
            "date": "22-08-2017",
            "open": 16.27,
            "high": 16.41,
            "low": 16.16,
            "close": 16.2,
            "adjclose": 15.79
        },
        "1503495000": {
            "date": "23-08-2017",
            "open": 16.2,
            "high": 16.24,
            "low": 16.1,
            "close": 16.15,
            "adjclose": 15.74
        },
        "1503581400": {
            "date": "24-08-2017",
            "open": 16.11,
            "high": 16.15,
            "low": 15.98,
            "close": 16.11,
            "adjclose": 15.7
        },
        "1503667800": {
            "date": "25-08-2017",
            "open": 16.15,
            "high": 16.31,
            "low": 16.01,
            "close": 16.16,
            "adjclose": 15.75
        },
        "1503927000": {
            "date": "28-08-2017",
            "open": 16.23,
            "high": 16.33,
            "low": 15.86,
            "close": 16.28,
            "adjclose": 15.87
        },
        "1504013400": {
            "date": "29-08-2017",
            "open": 16.16,
            "high": 16.43,
            "low": 16,
            "close": 16.4,
            "adjclose": 15.99
        },
        "1504099800": {
            "date": "30-08-2017",
            "open": 16.42,
            "high": 16.91,
            "low": 16.41,
            "close": 16.89,
            "adjclose": 16.46
        },
        "1504186200": {
            "date": "31-08-2017",
            "open": 16.92,
            "high": 16.94,
            "low": 16.59,
            "close": 16.71,
            "adjclose": 16.29
        },
        "1504272600": {
            "date": "01-09-2017",
            "open": 16.77,
            "high": 16.87,
            "low": 16.59,
            "close": 16.84,
            "adjclose": 16.41
        },
        "1504531800": {
            "date": "04-09-2017",
            "open": 16.72,
            "high": 16.8,
            "low": 16.63,
            "close": 16.66,
            "adjclose": 16.24
        },
        "1504618200": {
            "date": "05-09-2017",
            "open": 16.68,
            "high": 16.83,
            "low": 16.38,
            "close": 16.42,
            "adjclose": 16.01
        },
        "1504704600": {
            "date": "06-09-2017",
            "open": 16.38,
            "high": 16.51,
            "low": 16.3,
            "close": 16.34,
            "adjclose": 15.93
        },
        "1504791000": {
            "date": "07-09-2017",
            "open": 16.34,
            "high": 16.34,
            "low": 16.13,
            "close": 16.16,
            "adjclose": 15.75
        },
        "1504877400": {
            "date": "08-09-2017",
            "open": 16.2,
            "high": 16.25,
            "low": 16.01,
            "close": 16.21,
            "adjclose": 15.8
        },
        "1505136600": {
            "date": "11-09-2017",
            "open": 16.27,
            "high": 16.41,
            "low": 15.99,
            "close": 16.12,
            "adjclose": 15.71
        },
        "1505223000": {
            "date": "12-09-2017",
            "open": 16.16,
            "high": 16.27,
            "low": 16.09,
            "close": 16.21,
            "adjclose": 15.8
        },
        "1505309400": {
            "date": "13-09-2017",
            "open": 16.26,
            "high": 16.26,
            "low": 15.96,
            "close": 15.98,
            "adjclose": 15.58
        },
        "1505395800": {
            "date": "14-09-2017",
            "open": 15.95,
            "high": 16.2,
            "low": 15.95,
            "close": 16.15,
            "adjclose": 15.74
        },
        "1505482200": {
            "date": "15-09-2017",
            "open": 16.13,
            "high": 16.13,
            "low": 15.97,
            "close": 16,
            "adjclose": 15.6
        },
        "1505741400": {
            "date": "18-09-2017",
            "open": 15.93,
            "high": 16.27,
            "low": 15.85,
            "close": 16.14,
            "adjclose": 15.73
        },
        "1505827800": {
            "date": "19-09-2017",
            "open": 16.19,
            "high": 16.25,
            "low": 16.01,
            "close": 16.24,
            "adjclose": 15.83
        },
        "1505914200": {
            "date": "20-09-2017",
            "open": 16.31,
            "high": 16.7,
            "low": 16.26,
            "close": 16.65,
            "adjclose": 16.23
        },
        "1506000600": {
            "date": "21-09-2017",
            "open": 16.69,
            "high": 16.77,
            "low": 16.42,
            "close": 16.72,
            "adjclose": 16.3
        },
        "1506087000": {
            "date": "22-09-2017",
            "open": 16.61,
            "high": 16.76,
            "low": 16.55,
            "close": 16.58,
            "adjclose": 16.16
        },
        "1506346200": {
            "date": "25-09-2017",
            "open": 16.59,
            "high": 16.71,
            "low": 16.35,
            "close": 16.5,
            "adjclose": 16.08
        },
        "1506432600": {
            "date": "26-09-2017",
            "open": 16.55,
            "high": 16.6,
            "low": 16.42,
            "close": 16.47,
            "adjclose": 16.05
        },
        "1506519000": {
            "date": "27-09-2017",
            "open": 16.45,
            "high": 16.69,
            "low": 16.35,
            "close": 16.42,
            "adjclose": 16.01
        },
        "1506605400": {
            "date": "28-09-2017",
            "open": 16.37,
            "high": 16.58,
            "low": 16.33,
            "close": 16.36,
            "adjclose": 15.95
        },
        "1506691800": {
            "date": "29-09-2017",
            "open": 16.33,
            "high": 16.62,
            "low": 16.33,
            "close": 16.55,
            "adjclose": 16.13
        },
        "1506951000": {
            "date": "02-10-2017",
            "open": 16.58,
            "high": 16.69,
            "low": 16.53,
            "close": 16.57,
            "adjclose": 16.15
        },
        "1507037400": {
            "date": "03-10-2017",
            "open": 16.64,
            "high": 16.66,
            "low": 16.45,
            "close": 16.56,
            "adjclose": 16.14
        },
        "1507123800": {
            "date": "04-10-2017",
            "open": 16.6,
            "high": 16.6,
            "low": 16.46,
            "close": 16.54,
            "adjclose": 16.12
        },
        "1507210200": {
            "date": "05-10-2017",
            "open": 16.49,
            "high": 16.63,
            "low": 16.45,
            "close": 16.49,
            "adjclose": 16.07
        },
        "1507296600": {
            "date": "06-10-2017",
            "open": 16.59,
            "high": 16.68,
            "low": 16.43,
            "close": 16.62,
            "adjclose": 16.2
        },
        "1507555800": {
            "date": "09-10-2017",
            "open": 16.68,
            "high": 16.68,
            "low": 16.14,
            "close": 16.18,
            "adjclose": 15.77
        },
        "1507642200": {
            "date": "10-10-2017",
            "open": 16.26,
            "high": 16.26,
            "low": 15.86,
            "close": 15.91,
            "adjclose": 15.51
        },
        "1507728600": {
            "date": "11-10-2017",
            "open": 15.93,
            "high": 15.93,
            "low": 15.35,
            "close": 15.4,
            "adjclose": 15.01
        },
        "1507815000": {
            "date": "12-10-2017",
            "open": 15.54,
            "high": 15.54,
            "low": 15,
            "close": 15.09,
            "adjclose": 14.71
        },
        "1507901400": {
            "date": "13-10-2017",
            "open": 15.11,
            "high": 15.44,
            "low": 15.09,
            "close": 15.29,
            "adjclose": 14.9
        },
        "1508160600": {
            "date": "16-10-2017",
            "open": 15.36,
            "high": 15.4,
            "low": 14.82,
            "close": 14.9,
            "adjclose": 14.52
        },
        "1508247000": {
            "date": "17-10-2017",
            "open": 15,
            "high": 15.4,
            "low": 14.93,
            "close": 15.34,
            "adjclose": 14.95
        },
        "1508333400": {
            "date": "18-10-2017",
            "open": 15.33,
            "high": 15.68,
            "low": 15.17,
            "close": 15.21,
            "adjclose": 14.83
        },
        "1508419800": {
            "date": "19-10-2017",
            "open": 15.23,
            "high": 15.32,
            "low": 15.05,
            "close": 15.3,
            "adjclose": 14.91
        },
        "1508506200": {
            "date": "20-10-2017",
            "open": 15.37,
            "high": 15.59,
            "low": 15.14,
            "close": 15.18,
            "adjclose": 14.8
        },
        "1508765400": {
            "date": "23-10-2017",
            "open": 15.24,
            "high": 15.63,
            "low": 15.24,
            "close": 15.46,
            "adjclose": 15.07
        },
        "1508851800": {
            "date": "24-10-2017",
            "open": 15.55,
            "high": 15.93,
            "low": 15.55,
            "close": 15.89,
            "adjclose": 15.49
        },
        "1508938200": {
            "date": "25-10-2017",
            "open": 15.92,
            "high": 15.92,
            "low": 15.45,
            "close": 15.52,
            "adjclose": 15.13
        },
        "1509024600": {
            "date": "26-10-2017",
            "open": 15.61,
            "high": 15.91,
            "low": 15.61,
            "close": 15.75,
            "adjclose": 15.35
        },
        "1509111000": {
            "date": "27-10-2017",
            "open": 15.81,
            "high": 15.85,
            "low": 15.55,
            "close": 15.75,
            "adjclose": 15.35
        },
        "1509373800": {
            "date": "30-10-2017",
            "open": 15.72,
            "high": 15.85,
            "low": 15.44,
            "close": 15.51,
            "adjclose": 15.12
        },
        "1509460200": {
            "date": "31-10-2017",
            "open": 15.53,
            "high": 15.8,
            "low": 15.21,
            "close": 15.58,
            "adjclose": 15.19
        },
        "1509546600": {
            "date": "01-11-2017",
            "open": 15.63,
            "high": 15.75,
            "low": 15.25,
            "close": 15.3,
            "adjclose": 14.91
        },
        "1509719400": {
            "date": "03-11-2017",
            "open": 15.31,
            "high": 15.45,
            "low": 15.15,
            "close": 15.17,
            "adjclose": 14.79
        },
        "1509978600": {
            "date": "06-11-2017",
            "open": 15.3,
            "high": 15.43,
            "low": 15.05,
            "close": 15.37,
            "adjclose": 14.98
        },
        "1510065000": {
            "date": "07-11-2017",
            "open": 15.27,
            "high": 15.56,
            "low": 15.27,
            "close": 15.52,
            "adjclose": 15.13
        },
        "1510151400": {
            "date": "08-11-2017",
            "open": 15.54,
            "high": 15.71,
            "low": 15.45,
            "close": 15.68,
            "adjclose": 15.28
        },
        "1510237800": {
            "date": "09-11-2017",
            "open": 15.59,
            "high": 15.8,
            "low": 15.53,
            "close": 15.76,
            "adjclose": 15.36
        },
        "1510324200": {
            "date": "10-11-2017",
            "open": 15.68,
            "high": 15.73,
            "low": 15.52,
            "close": 15.54,
            "adjclose": 15.15
        },
        "1510583400": {
            "date": "13-11-2017",
            "open": 15.54,
            "high": 15.56,
            "low": 15.13,
            "close": 15.19,
            "adjclose": 14.81
        },
        "1510669800": {
            "date": "14-11-2017",
            "open": 15.26,
            "high": 15.26,
            "low": 15.02,
            "close": 15.08,
            "adjclose": 14.7
        },
        "1510756200": {
            "date": "15-11-2017",
            "open": 15,
            "high": 15.17,
            "low": 14.87,
            "close": 14.91,
            "adjclose": 14.53
        },
        "1510842600": {
            "date": "16-11-2017",
            "open": 15.08,
            "high": 15.25,
            "low": 14.9,
            "close": 15.02,
            "adjclose": 14.64
        },
        "1510929000": {
            "date": "17-11-2017",
            "open": 15.02,
            "high": 15.1,
            "low": 14.89,
            "close": 14.91,
            "adjclose": 14.53
        },
        "1511274600": {
            "date": "21-11-2017",
            "open": 14.91,
            "high": 14.99,
            "low": 14.75,
            "close": 14.77,
            "adjclose": 14.4
        },
        "1511361000": {
            "date": "22-11-2017",
            "open": 14.8,
            "high": 14.92,
            "low": 14.61,
            "close": 14.64,
            "adjclose": 14.27
        },
        "1511447400": {
            "date": "23-11-2017",
            "open": 14.7,
            "high": 14.87,
            "low": 14.69,
            "close": 14.85,
            "adjclose": 14.48
        },
        "1511533800": {
            "date": "24-11-2017",
            "open": 14.84,
            "high": 14.84,
            "low": 14.52,
            "close": 14.65,
            "adjclose": 14.28
        },
        "1511793000": {
            "date": "27-11-2017",
            "open": 14.57,
            "high": 14.57,
            "low": 14.39,
            "close": 14.44,
            "adjclose": 14.08
        },
        "1511879400": {
            "date": "28-11-2017",
            "open": 14.45,
            "high": 14.62,
            "low": 14.26,
            "close": 14.6,
            "adjclose": 14.23
        },
        "1511965800": {
            "date": "29-11-2017",
            "open": 14.62,
            "high": 14.62,
            "low": 14.4,
            "close": 14.51,
            "adjclose": 14.14
        },
        "1512052200": {
            "date": "30-11-2017",
            "open": 14.63,
            "high": 14.63,
            "low": 14.17,
            "close": 14.26,
            "adjclose": 13.9
        },
        "1512138600": {
            "date": "01-12-2017",
            "open": 14.2,
            "high": 14.35,
            "low": 13.88,
            "close": 14.06,
            "adjclose": 13.71
        },
        "1512397800": {
            "date": "04-12-2017",
            "open": 14.06,
            "high": 14.26,
            "low": 13.83,
            "close": 13.87,
            "adjclose": 13.52
        },
        "1512484200": {
            "date": "05-12-2017",
            "open": 13.92,
            "high": 13.93,
            "low": 13.72,
            "close": 13.77,
            "adjclose": 13.42
        },
        "1512570600": {
            "date": "06-12-2017",
            "open": 13.75,
            "high": 13.83,
            "low": 13.55,
            "close": 13.6,
            "adjclose": 13.26
        },
        "1512657000": {
            "date": "07-12-2017",
            "open": 13.63,
            "high": 14.06,
            "low": 13.53,
            "close": 13.89,
            "adjclose": 13.54
        },
        "1512743400": {
            "date": "08-12-2017",
            "open": 13.95,
            "high": 14.23,
            "low": 13.92,
            "close": 14.19,
            "adjclose": 13.83
        },
        "1513002600": {
            "date": "11-12-2017",
            "open": 14.1,
            "high": 14.44,
            "low": 14.1,
            "close": 14.29,
            "adjclose": 13.93
        },
        "1513175400": {
            "date": "13-12-2017",
            "open": 14.47,
            "high": 14.58,
            "low": 14.31,
            "close": 14.47,
            "adjclose": 14.1
        },
        "1513261800": {
            "date": "14-12-2017",
            "open": 14.52,
            "high": 14.52,
            "low": 14.2,
            "close": 14.36,
            "adjclose": 14
        },
        "1513348200": {
            "date": "15-12-2017",
            "open": 14.28,
            "high": 14.48,
            "low": 14.15,
            "close": 14.19,
            "adjclose": 13.83
        },
        "1513607400": {
            "date": "18-12-2017",
            "open": 14.19,
            "high": 14.41,
            "low": 14.13,
            "close": 14.32,
            "adjclose": 13.96
        },
        "1513693800": {
            "date": "19-12-2017",
            "open": 14.44,
            "high": 14.58,
            "low": 14.17,
            "close": 14.26,
            "adjclose": 13.9
        },
        "1513780200": {
            "date": "20-12-2017",
            "open": 14.19,
            "high": 14.5,
            "low": 14.19,
            "close": 14.49,
            "adjclose": 14.12
        },
        "1513866600": {
            "date": "21-12-2017",
            "open": 14.5,
            "high": 14.79,
            "low": 14.5,
            "close": 14.68,
            "adjclose": 14.31
        },
        "1513953000": {
            "date": "22-12-2017",
            "open": 14.74,
            "high": 14.75,
            "low": 14.61,
            "close": 14.71,
            "adjclose": 14.34
        },
        "1514298600": {
            "date": "26-12-2017",
            "open": 14.66,
            "high": 14.87,
            "low": 14.61,
            "close": 14.78,
            "adjclose": 14.41
        },
        "1514385000": {
            "date": "27-12-2017",
            "open": 14.8,
            "high": 14.86,
            "low": 14.71,
            "close": 14.78,
            "adjclose": 14.41
        },
        "1514471400": {
            "date": "28-12-2017",
            "open": 14.85,
            "high": 14.87,
            "low": 14.69,
            "close": 14.75,
            "adjclose": 14.38
        },
        "1514557800": {
            "date": "29-12-2017",
            "open": 14.75,
            "high": 14.81,
            "low": 14.62,
            "close": 14.7,
            "adjclose": 14.33
        },
        "1514903400": {
            "date": "02-01-2018",
            "open": 14.77,
            "high": 15.13,
            "low": 14.61,
            "close": 15.07,
            "adjclose": 14.69
        },
        "1514989800": {
            "date": "03-01-2018",
            "open": 15.07,
            "high": 15.43,
            "low": 15.02,
            "close": 15.25,
            "adjclose": 14.86
        },
        "1515076200": {
            "date": "04-01-2018",
            "open": 15.32,
            "high": 15.49,
            "low": 15.28,
            "close": 15.39,
            "adjclose": 15
        },
        "1515162600": {
            "date": "05-01-2018",
            "open": 15.42,
            "high": 15.51,
            "low": 15.15,
            "close": 15.18,
            "adjclose": 14.8
        },
        "1515421800": {
            "date": "08-01-2018",
            "open": 15.28,
            "high": 15.29,
            "low": 15.09,
            "close": 15.15,
            "adjclose": 14.77
        },
        "1515508200": {
            "date": "09-01-2018",
            "open": 15.15,
            "high": 15.19,
            "low": 14.89,
            "close": 14.95,
            "adjclose": 14.57
        },
        "1515594600": {
            "date": "10-01-2018",
            "open": 15.04,
            "high": 15.1,
            "low": 14.84,
            "close": 15.01,
            "adjclose": 14.63
        },
        "1515681000": {
            "date": "11-01-2018",
            "open": 15.01,
            "high": 15.37,
            "low": 15.01,
            "close": 15.33,
            "adjclose": 14.94
        },
        "1515767400": {
            "date": "12-01-2018",
            "open": 15.3,
            "high": 15.55,
            "low": 15.21,
            "close": 15.31,
            "adjclose": 14.92
        },
        "1516026600": {
            "date": "15-01-2018",
            "open": 15.42,
            "high": 15.55,
            "low": 15.23,
            "close": 15.37,
            "adjclose": 14.98
        },
        "1516113000": {
            "date": "16-01-2018",
            "open": 15.4,
            "high": 15.51,
            "low": 15.22,
            "close": 15.36,
            "adjclose": 14.97
        },
        "1516199400": {
            "date": "17-01-2018",
            "open": 15.46,
            "high": 15.46,
            "low": 15.18,
            "close": 15.29,
            "adjclose": 14.9
        },
        "1516285800": {
            "date": "18-01-2018",
            "open": 15.33,
            "high": 15.33,
            "low": 15.18,
            "close": 15.25,
            "adjclose": 14.86
        },
        "1516372200": {
            "date": "19-01-2018",
            "open": 15.26,
            "high": 15.37,
            "low": 15.24,
            "close": 15.27,
            "adjclose": 14.88
        },
        "1516631400": {
            "date": "22-01-2018",
            "open": 15.35,
            "high": 15.49,
            "low": 15.27,
            "close": 15.4,
            "adjclose": 15.01
        },
        "1516717800": {
            "date": "23-01-2018",
            "open": 15.46,
            "high": 15.64,
            "low": 15.29,
            "close": 15.62,
            "adjclose": 15.23
        },
        "1516804200": {
            "date": "24-01-2018",
            "open": 15.51,
            "high": 15.8,
            "low": 15.51,
            "close": 15.58,
            "adjclose": 15.19
        },
        "1516890600": {
            "date": "25-01-2018",
            "open": 15.61,
            "high": 15.74,
            "low": 15.38,
            "close": 15.43,
            "adjclose": 15.04
        },
        "1516977000": {
            "date": "26-01-2018",
            "open": 15.39,
            "high": 15.8,
            "low": 15.27,
            "close": 15.7,
            "adjclose": 15.3
        },
        "1517236200": {
            "date": "29-01-2018",
            "open": 15.65,
            "high": 15.7,
            "low": 15.35,
            "close": 15.51,
            "adjclose": 15.12
        },
        "1517322600": {
            "date": "30-01-2018",
            "open": 15.4,
            "high": 15.79,
            "low": 15.33,
            "close": 15.77,
            "adjclose": 15.37
        },
        "1517409000": {
            "date": "31-01-2018",
            "open": 15.77,
            "high": 15.8,
            "low": 15.43,
            "close": 15.48,
            "adjclose": 15.09
        },
        "1517495400": {
            "date": "01-02-2018",
            "open": 15.54,
            "high": 15.67,
            "low": 15.29,
            "close": 15.34,
            "adjclose": 14.95
        },
        "1517581800": {
            "date": "02-02-2018",
            "open": 15.29,
            "high": 15.43,
            "low": 15.06,
            "close": 15.21,
            "adjclose": 14.83
        },
        "1517927400": {
            "date": "06-02-2018",
            "open": 14.75,
            "high": 15.06,
            "low": 14.6,
            "close": 14.92,
            "adjclose": 14.54
        },
        "1518013800": {
            "date": "07-02-2018",
            "open": 14.92,
            "high": 15.13,
            "low": 14.65,
            "close": 14.7,
            "adjclose": 14.33
        },
        "1518100200": {
            "date": "08-02-2018",
            "open": 14.76,
            "high": 14.76,
            "low": 13.9,
            "close": 14.03,
            "adjclose": 13.68
        },
        "1518186600": {
            "date": "09-02-2018",
            "open": 14.1,
            "high": 14.31,
            "low": 13.57,
            "close": 13.96,
            "adjclose": 13.61
        },
        "1518445800": {
            "date": "12-02-2018",
            "open": 14,
            "high": 14.13,
            "low": 13.76,
            "close": 13.79,
            "adjclose": 13.44
        },
        "1518532200": {
            "date": "13-02-2018",
            "open": 13.79,
            "high": 13.91,
            "low": 13.65,
            "close": 13.78,
            "adjclose": 13.43
        },
        "1518618600": {
            "date": "14-02-2018",
            "open": 13.77,
            "high": 14.23,
            "low": 13.65,
            "close": 14.14,
            "adjclose": 13.78
        },
        "1518705000": {
            "date": "15-02-2018",
            "open": 14.1,
            "high": 14.1,
            "low": 13.76,
            "close": 13.94,
            "adjclose": 13.59
        },
        "1518791400": {
            "date": "16-02-2018",
            "open": 13.92,
            "high": 14.16,
            "low": 13.7,
            "close": 13.91,
            "adjclose": 13.56
        },
        "1519050600": {
            "date": "19-02-2018",
            "open": 13.98,
            "high": 14.03,
            "low": 13.84,
            "close": 13.93,
            "adjclose": 13.58
        },
        "1519137000": {
            "date": "20-02-2018",
            "open": 14,
            "high": 14,
            "low": 13.46,
            "close": 13.52,
            "adjclose": 13.18
        },
        "1519223400": {
            "date": "21-02-2018",
            "open": 13.56,
            "high": 13.59,
            "low": 13.19,
            "close": 13.28,
            "adjclose": 12.94
        },
        "1519309800": {
            "date": "22-02-2018",
            "open": 13.31,
            "high": 13.68,
            "low": 13.27,
            "close": 13.5,
            "adjclose": 13.16
        },
        "1519396200": {
            "date": "23-02-2018",
            "open": 13.56,
            "high": 13.56,
            "low": 13.18,
            "close": 13.23,
            "adjclose": 12.9
        },
        "1519655400": {
            "date": "26-02-2018",
            "open": 13.21,
            "high": 13.34,
            "low": 12.87,
            "close": 13.05,
            "adjclose": 12.72
        },
        "1519741800": {
            "date": "27-02-2018",
            "open": 13.11,
            "high": 13.23,
            "low": 12.65,
            "close": 12.69,
            "adjclose": 12.37
        },
        "1519828200": {
            "date": "28-02-2018",
            "open": 12.75,
            "high": 12.75,
            "low": 12.23,
            "close": 12.45,
            "adjclose": 12.14
        },
        "1519914600": {
            "date": "01-03-2018",
            "open": 12.52,
            "high": 13.14,
            "low": 12.52,
            "close": 13.1,
            "adjclose": 12.77
        },
        "1520001000": {
            "date": "02-03-2018",
            "open": 12.94,
            "high": 13.17,
            "low": 12.66,
            "close": 13.1,
            "adjclose": 12.77
        },
        "1520260200": {
            "date": "05-03-2018",
            "open": 13.13,
            "high": 13.2,
            "low": 12.94,
            "close": 13.01,
            "adjclose": 12.68
        },
        "1520346600": {
            "date": "06-03-2018",
            "open": 13.14,
            "high": 13.28,
            "low": 13.07,
            "close": 13.15,
            "adjclose": 12.82
        },
        "1520433000": {
            "date": "07-03-2018",
            "open": 13.01,
            "high": 13.11,
            "low": 12.9,
            "close": 13,
            "adjclose": 12.67
        },
        "1520519400": {
            "date": "08-03-2018",
            "open": 13.06,
            "high": 13.57,
            "low": 12.96,
            "close": 13.55,
            "adjclose": 13.21
        },
        "1520605800": {
            "date": "09-03-2018",
            "open": 13.61,
            "high": 13.82,
            "low": 13.54,
            "close": 13.72,
            "adjclose": 13.37
        },
        "1520865000": {
            "date": "12-03-2018",
            "open": 13.78,
            "high": 13.79,
            "low": 13.47,
            "close": 13.55,
            "adjclose": 13.21
        },
        "1520951400": {
            "date": "13-03-2018",
            "open": 13.51,
            "high": 13.73,
            "low": 13.43,
            "close": 13.68,
            "adjclose": 13.33
        },
        "1521037800": {
            "date": "14-03-2018",
            "open": 13.68,
            "high": 13.68,
            "low": 13.34,
            "close": 13.44,
            "adjclose": 13.1
        },
        "1521124200": {
            "date": "15-03-2018",
            "open": 13.48,
            "high": 13.8,
            "low": 13.34,
            "close": 13.38,
            "adjclose": 13.04
        },
        "1521210600": {
            "date": "16-03-2018",
            "open": 13.35,
            "high": 13.39,
            "low": 12.99,
            "close": 13.07,
            "adjclose": 12.74
        },
        "1521556200": {
            "date": "20-03-2018",
            "open": 12.91,
            "high": 12.97,
            "low": 12.6,
            "close": 12.62,
            "adjclose": 12.3
        },
        "1521642600": {
            "date": "21-03-2018",
            "open": 12.66,
            "high": 12.8,
            "low": 12.44,
            "close": 12.65,
            "adjclose": 12.33
        },
        "1521729000": {
            "date": "22-03-2018",
            "open": 12.63,
            "high": 12.63,
            "low": 12.38,
            "close": 12.43,
            "adjclose": 12.12
        },
        "1521815400": {
            "date": "23-03-2018",
            "open": 13.09,
            "high": 13.39,
            "low": 12.85,
            "close": 12.99,
            "adjclose": 12.66
        },
        "1522074600": {
            "date": "26-03-2018",
            "open": 13.09,
            "high": 13.09,
            "low": 12.64,
            "close": 12.92,
            "adjclose": 12.59
        },
        "1522161000": {
            "date": "27-03-2018",
            "open": 12.95,
            "high": 13.05,
            "low": 12.6,
            "close": 12.65,
            "adjclose": 12.33
        },
        "1522247400": {
            "date": "28-03-2018",
            "open": 12.65,
            "high": 12.67,
            "low": 11.98,
            "close": 12.03,
            "adjclose": 11.73
        },
        "1522675800": {
            "date": "02-04-2018",
            "open": 12.07,
            "high": 12.21,
            "low": 11.86,
            "close": 11.99,
            "adjclose": 11.69
        },
        "1522762200": {
            "date": "03-04-2018",
            "open": 11.97,
            "high": 12.14,
            "low": 11.9,
            "close": 12.12,
            "adjclose": 11.81
        },
        "1522848600": {
            "date": "04-04-2018",
            "open": 12,
            "high": 12.45,
            "low": 11.87,
            "close": 12.4,
            "adjclose": 12.09
        },
        "1522935000": {
            "date": "05-04-2018",
            "open": 12.48,
            "high": 12.71,
            "low": 12.41,
            "close": 12.63,
            "adjclose": 12.31
        },
        "1523021400": {
            "date": "06-04-2018",
            "open": 12.6,
            "high": 12.76,
            "low": 12.34,
            "close": 12.66,
            "adjclose": 12.34
        },
        "1523280600": {
            "date": "09-04-2018",
            "open": 12.91,
            "high": 13.19,
            "low": 12.87,
            "close": 13.04,
            "adjclose": 12.71
        },
        "1523367000": {
            "date": "10-04-2018",
            "open": 13.15,
            "high": 13.23,
            "low": 12.91,
            "close": 12.98,
            "adjclose": 12.65
        },
        "1523453400": {
            "date": "11-04-2018",
            "open": 12.93,
            "high": 13.08,
            "low": 12.88,
            "close": 13.05,
            "adjclose": 12.72
        },
        "1523539800": {
            "date": "12-04-2018",
            "open": 13.05,
            "high": 13.16,
            "low": 12.94,
            "close": 13.06,
            "adjclose": 12.73
        },
        "1523626200": {
            "date": "13-04-2018",
            "open": 13.08,
            "high": 13.08,
            "low": 12.77,
            "close": 12.89,
            "adjclose": 12.56
        },
        "1523885400": {
            "date": "16-04-2018",
            "open": 13,
            "high": 13,
            "low": 12.57,
            "close": 12.6,
            "adjclose": 12.28
        },
        "1523971800": {
            "date": "17-04-2018",
            "open": 12.55,
            "high": 12.95,
            "low": 12.55,
            "close": 12.92,
            "adjclose": 12.59
        },
        "1524058200": {
            "date": "18-04-2018",
            "open": 12.95,
            "high": 13.2,
            "low": 12.95,
            "close": 13.05,
            "adjclose": 12.72
        },
        "1524144600": {
            "date": "19-04-2018",
            "open": 12.96,
            "high": 13.15,
            "low": 12.73,
            "close": 12.85,
            "adjclose": 12.53
        },
        "1524231000": {
            "date": "20-04-2018",
            "open": 12.82,
            "high": 12.98,
            "low": 12.67,
            "close": 12.69,
            "adjclose": 12.37
        },
        "1524490200": {
            "date": "23-04-2018",
            "open": 12.65,
            "high": 12.98,
            "low": 12.65,
            "close": 12.86,
            "adjclose": 12.54
        },
        "1524576600": {
            "date": "24-04-2018",
            "open": 12.92,
            "high": 12.98,
            "low": 12.48,
            "close": 12.5,
            "adjclose": 12.18
        },
        "1524663000": {
            "date": "25-04-2018",
            "open": 12.54,
            "high": 12.75,
            "low": 12.39,
            "close": 12.47,
            "adjclose": 12.16
        },
        "1524749400": {
            "date": "26-04-2018",
            "open": 12.35,
            "high": 12.53,
            "low": 11.94,
            "close": 12.16,
            "adjclose": 11.85
        },
        "1524835800": {
            "date": "27-04-2018",
            "open": 12.16,
            "high": 12.16,
            "low": 11.61,
            "close": 11.67,
            "adjclose": 11.38
        },
        "1525095000": {
            "date": "30-04-2018",
            "open": 11.69,
            "high": 11.95,
            "low": 11.66,
            "close": 11.7,
            "adjclose": 11.4
        },
        "1525267800": {
            "date": "02-05-2018",
            "open": 11.6,
            "high": 11.72,
            "low": 11.39,
            "close": 11.44,
            "adjclose": 11.15
        },
        "1525354200": {
            "date": "03-05-2018",
            "open": 11.37,
            "high": 11.51,
            "low": 11.28,
            "close": 11.44,
            "adjclose": 11.15
        },
        "1525440600": {
            "date": "04-05-2018",
            "open": 11.49,
            "high": 11.64,
            "low": 11.38,
            "close": 11.54,
            "adjclose": 11.25
        },
        "1525699800": {
            "date": "07-05-2018",
            "open": 11.52,
            "high": 11.58,
            "low": 11.33,
            "close": 11.35,
            "adjclose": 11.06
        },
        "1525786200": {
            "date": "08-05-2018",
            "open": 11.38,
            "high": 11.7,
            "low": 11.37,
            "close": 11.67,
            "adjclose": 11.38
        },
        "1525872600": {
            "date": "09-05-2018",
            "open": 11.7,
            "high": 11.81,
            "low": 11.51,
            "close": 11.67,
            "adjclose": 11.38
        },
        "1525959000": {
            "date": "10-05-2018",
            "open": 11.57,
            "high": 11.96,
            "low": 11.57,
            "close": 11.68,
            "adjclose": 11.39
        },
        "1526045400": {
            "date": "11-05-2018",
            "open": 11.78,
            "high": 11.79,
            "low": 11.51,
            "close": 11.72,
            "adjclose": 11.42
        },
        "1526304600": {
            "date": "14-05-2018",
            "open": 11.67,
            "high": 11.75,
            "low": 11.56,
            "close": 11.6,
            "adjclose": 11.31
        },
        "1526391000": {
            "date": "15-05-2018",
            "open": 11.57,
            "high": 11.66,
            "low": 11.47,
            "close": 11.57,
            "adjclose": 11.28
        },
        "1526477400": {
            "date": "16-05-2018",
            "open": 11.57,
            "high": 11.88,
            "low": 11.55,
            "close": 11.85,
            "adjclose": 11.55
        },
        "1526563800": {
            "date": "17-05-2018",
            "open": 11.8,
            "high": 11.98,
            "low": 11.52,
            "close": 11.56,
            "adjclose": 11.27
        },
        "1526650200": {
            "date": "18-05-2018",
            "open": 11.55,
            "high": 11.71,
            "low": 11.45,
            "close": 11.67,
            "adjclose": 11.38
        },
        "1526909400": {
            "date": "21-05-2018",
            "open": 11.62,
            "high": 12.24,
            "low": 11.47,
            "close": 11.89,
            "adjclose": 11.59
        },
        "1526995800": {
            "date": "22-05-2018",
            "open": 11.84,
            "high": 11.96,
            "low": 11.84,
            "close": 11.91,
            "adjclose": 11.61
        },
        "1527082200": {
            "date": "23-05-2018",
            "open": 11.85,
            "high": 12.17,
            "low": 11.69,
            "close": 11.91,
            "adjclose": 11.61
        },
        "1527168600": {
            "date": "24-05-2018",
            "open": 11.83,
            "high": 11.98,
            "low": 11.7,
            "close": 11.77,
            "adjclose": 11.47
        },
        "1527255000": {
            "date": "25-05-2018",
            "open": 11.71,
            "high": 11.9,
            "low": 11.71,
            "close": 11.75,
            "adjclose": 11.45
        },
        "1527514200": {
            "date": "28-05-2018",
            "open": 11.8,
            "high": 11.88,
            "low": 11.56,
            "close": 11.67,
            "adjclose": 11.38
        },
        "1527600600": {
            "date": "29-05-2018",
            "open": 11.7,
            "high": 11.8,
            "low": 11.59,
            "close": 11.75,
            "adjclose": 11.45
        },
        "1527687000": {
            "date": "30-05-2018",
            "open": 11.79,
            "high": 11.87,
            "low": 11.62,
            "close": 11.74,
            "adjclose": 11.44
        },
        "1527773400": {
            "date": "31-05-2018",
            "open": 11.72,
            "high": 11.9,
            "low": 11.7,
            "close": 11.86,
            "adjclose": 11.56
        },
        "1527859800": {
            "date": "01-06-2018",
            "open": 11.88,
            "high": 12.02,
            "low": 11.77,
            "close": 11.84,
            "adjclose": 11.54
        },
        "1528119000": {
            "date": "04-06-2018",
            "open": 11.86,
            "high": 12.08,
            "low": 11.86,
            "close": 12.01,
            "adjclose": 11.71
        },
        "1528205400": {
            "date": "05-06-2018",
            "open": 11.99,
            "high": 12.26,
            "low": 11.97,
            "close": 12.14,
            "adjclose": 11.83
        },
        "1528291800": {
            "date": "06-06-2018",
            "open": 12.23,
            "high": 12.3,
            "low": 12.14,
            "close": 12.25,
            "adjclose": 11.94
        },
        "1528378200": {
            "date": "07-06-2018",
            "open": 12.25,
            "high": 12.28,
            "low": 12.02,
            "close": 12.2,
            "adjclose": 11.89
        },
        "1528464600": {
            "date": "08-06-2018",
            "open": 12.12,
            "high": 12.29,
            "low": 12.12,
            "close": 12.24,
            "adjclose": 11.93
        },
        "1528723800": {
            "date": "11-06-2018",
            "open": 12.25,
            "high": 12.73,
            "low": 12.23,
            "close": 12.7,
            "adjclose": 12.38
        },
        "1528810200": {
            "date": "12-06-2018",
            "open": 12.7,
            "high": 12.78,
            "low": 12.56,
            "close": 12.67,
            "adjclose": 12.35
        },
        "1528896600": {
            "date": "13-06-2018",
            "open": 12.6,
            "high": 12.79,
            "low": 12.55,
            "close": 12.63,
            "adjclose": 12.31
        },
        "1528983000": {
            "date": "14-06-2018",
            "open": 12.52,
            "high": 12.94,
            "low": 12.43,
            "close": 12.89,
            "adjclose": 12.56
        },
        "1529069400": {
            "date": "15-06-2018",
            "open": 12.88,
            "high": 12.92,
            "low": 12.71,
            "close": 12.87,
            "adjclose": 12.55
        },
        "1529328600": {
            "date": "18-06-2018",
            "open": 12.87,
            "high": 12.87,
            "low": 12.53,
            "close": 12.65,
            "adjclose": 12.33
        },
        "1529415000": {
            "date": "19-06-2018",
            "open": 12.62,
            "high": 12.82,
            "low": 12.47,
            "close": 12.71,
            "adjclose": 12.39
        },
        "1529501400": {
            "date": "20-06-2018",
            "open": 12.71,
            "high": 12.92,
            "low": 12.59,
            "close": 12.88,
            "adjclose": 12.55
        },
        "1529587800": {
            "date": "21-06-2018",
            "open": 12.81,
            "high": 13.42,
            "low": 12.52,
            "close": 12.55,
            "adjclose": 12.23
        },
        "1529674200": {
            "date": "22-06-2018",
            "open": 12.62,
            "high": 12.84,
            "low": 12.52,
            "close": 12.75,
            "adjclose": 12.43
        },
        "1529933400": {
            "date": "25-06-2018",
            "open": 12.72,
            "high": 12.74,
            "low": 12.49,
            "close": 12.6,
            "adjclose": 12.28
        },
        "1530019800": {
            "date": "26-06-2018",
            "open": 12.58,
            "high": 13.16,
            "low": 12.52,
            "close": 13.14,
            "adjclose": 12.81
        },
        "1530106200": {
            "date": "27-06-2018",
            "open": 13.12,
            "high": 13.38,
            "low": 12.87,
            "close": 12.94,
            "adjclose": 12.61
        },
        "1530192600": {
            "date": "28-06-2018",
            "open": 12.94,
            "high": 13.05,
            "low": 12.7,
            "close": 13.01,
            "adjclose": 12.68
        },
        "1530279000": {
            "date": "29-06-2018",
            "open": 13.04,
            "high": 13.2,
            "low": 12.86,
            "close": 13.06,
            "adjclose": 12.73
        },
        "1530538200": {
            "date": "02-07-2018",
            "open": 13.11,
            "high": 13.11,
            "low": 12.38,
            "close": 12.69,
            "adjclose": 12.37
        },
        "1530624600": {
            "date": "03-07-2018",
            "open": 12.66,
            "high": 13.17,
            "low": 12.57,
            "close": 12.96,
            "adjclose": 12.63
        },
        "1530711000": {
            "date": "04-07-2018",
            "open": 12.88,
            "high": 13.12,
            "low": 12.8,
            "close": 13.06,
            "adjclose": 12.73
        },
        "1530797400": {
            "date": "05-07-2018",
            "open": 13.11,
            "high": 13.5,
            "low": 12.85,
            "close": 13.45,
            "adjclose": 13.11
        },
        "1530883800": {
            "date": "06-07-2018",
            "open": 13.45,
            "high": 13.53,
            "low": 13.26,
            "close": 13.34,
            "adjclose": 13
        },
        "1531143000": {
            "date": "09-07-2018",
            "open": 13.4,
            "high": 13.6,
            "low": 13.19,
            "close": 13.45,
            "adjclose": 13.11
        },
        "1531229400": {
            "date": "10-07-2018",
            "open": 13.41,
            "high": 13.46,
            "low": 13.2,
            "close": 13.31,
            "adjclose": 12.97
        },
        "1531315800": {
            "date": "11-07-2018",
            "open": 13.22,
            "high": 13.31,
            "low": 13.1,
            "close": 13.27,
            "adjclose": 12.93
        },
        "1531402200": {
            "date": "12-07-2018",
            "open": 13.22,
            "high": 13.33,
            "low": 13.04,
            "close": 13.05,
            "adjclose": 12.72
        },
        "1531488600": {
            "date": "13-07-2018",
            "open": 13.03,
            "high": 13.12,
            "low": 12.8,
            "close": 12.86,
            "adjclose": 12.54
        },
        "1531747800": {
            "date": "16-07-2018",
            "open": 12.8,
            "high": 12.8,
            "low": 12.5,
            "close": 12.63,
            "adjclose": 12.31
        },
        "1531834200": {
            "date": "17-07-2018",
            "open": 12.65,
            "high": 12.7,
            "low": 12.41,
            "close": 12.58,
            "adjclose": 12.26
        },
        "1531920600": {
            "date": "18-07-2018",
            "open": 12.55,
            "high": 12.87,
            "low": 12.52,
            "close": 12.82,
            "adjclose": 12.5
        },
        "1532007000": {
            "date": "19-07-2018",
            "open": 12.78,
            "high": 12.96,
            "low": 12.72,
            "close": 12.78,
            "adjclose": 12.46
        },
        "1532093400": {
            "date": "20-07-2018",
            "open": 12.75,
            "high": 13.03,
            "low": 12.15,
            "close": 12.73,
            "adjclose": 12.41
        },
        "1532352600": {
            "date": "23-07-2018",
            "open": 12.76,
            "high": 12.89,
            "low": 12.5,
            "close": 12.72,
            "adjclose": 12.4
        },
        "1532439000": {
            "date": "24-07-2018",
            "open": 12.78,
            "high": 13.3,
            "low": 12.74,
            "close": 13.17,
            "adjclose": 12.84
        },
        "1532525400": {
            "date": "25-07-2018",
            "open": 13.24,
            "high": 13.44,
            "low": 13.02,
            "close": 13.23,
            "adjclose": 12.9
        },
        "1532611800": {
            "date": "26-07-2018",
            "open": 13.37,
            "high": 14.1,
            "low": 13.3,
            "close": 13.82,
            "adjclose": 13.47
        },
        "1532698200": {
            "date": "27-07-2018",
            "open": 13.8,
            "high": 14.06,
            "low": 13.73,
            "close": 13.93,
            "adjclose": 13.58
        },
        "1532957400": {
            "date": "30-07-2018",
            "open": 13.89,
            "high": 14.07,
            "low": 13.79,
            "close": 14.01,
            "adjclose": 13.66
        },
        "1533043800": {
            "date": "31-07-2018",
            "open": 14.01,
            "high": 14.1,
            "low": 13.82,
            "close": 13.89,
            "adjclose": 13.54
        },
        "1533130200": {
            "date": "01-08-2018",
            "open": 13.86,
            "high": 14.03,
            "low": 13.73,
            "close": 13.9,
            "adjclose": 13.55
        },
        "1533216600": {
            "date": "02-08-2018",
            "open": 13.84,
            "high": 13.84,
            "low": 13.6,
            "close": 13.78,
            "adjclose": 13.43
        },
        "1533303000": {
            "date": "03-08-2018",
            "open": 13.8,
            "high": 13.9,
            "low": 13.66,
            "close": 13.88,
            "adjclose": 13.53
        },
        "1533562200": {
            "date": "06-08-2018",
            "open": 13.9,
            "high": 14.05,
            "low": 13.86,
            "close": 13.93,
            "adjclose": 13.58
        },
        "1533648600": {
            "date": "07-08-2018",
            "open": 14,
            "high": 14.09,
            "low": 13.75,
            "close": 13.77,
            "adjclose": 13.42
        },
        "1533735000": {
            "date": "08-08-2018",
            "open": 13.8,
            "high": 13.81,
            "low": 13.65,
            "close": 13.79,
            "adjclose": 13.44
        },
        "1533821400": {
            "date": "09-08-2018",
            "open": 13.83,
            "high": 13.83,
            "low": 13.26,
            "close": 13.28,
            "adjclose": 12.94
        },
        "1533907800": {
            "date": "10-08-2018",
            "open": 13.21,
            "high": 13.34,
            "low": 13.04,
            "close": 13.28,
            "adjclose": 12.94
        },
        "1534167000": {
            "date": "13-08-2018",
            "open": 13.34,
            "high": 13.34,
            "low": 13.1,
            "close": 13.18,
            "adjclose": 12.85
        },
        "1534253400": {
            "date": "14-08-2018",
            "open": 13.2,
            "high": 13.47,
            "low": 13.12,
            "close": 13.42,
            "adjclose": 13.08
        },
        "1534339800": {
            "date": "15-08-2018",
            "open": 13.35,
            "high": 13.35,
            "low": 12.91,
            "close": 13.12,
            "adjclose": 12.79
        },
        "1534426200": {
            "date": "16-08-2018",
            "open": 13.16,
            "high": 13.16,
            "low": 12.51,
            "close": 12.59,
            "adjclose": 12.27
        },
        "1534512600": {
            "date": "17-08-2018",
            "open": 12.6,
            "high": 12.79,
            "low": 12.57,
            "close": 12.75,
            "adjclose": 12.43
        },
        "1534771800": {
            "date": "20-08-2018",
            "open": 12.75,
            "high": 12.86,
            "low": 12.51,
            "close": 12.77,
            "adjclose": 12.45
        },
        "1534858200": {
            "date": "21-08-2018",
            "open": 12.83,
            "high": 13.24,
            "low": 12.78,
            "close": 13.19,
            "adjclose": 12.86
        },
        "1534944600": {
            "date": "22-08-2018",
            "open": 13.11,
            "high": 13.45,
            "low": 13,
            "close": 13.39,
            "adjclose": 13.05
        },
        "1535031000": {
            "date": "23-08-2018",
            "open": 13.39,
            "high": 13.52,
            "low": 13.25,
            "close": 13.3,
            "adjclose": 12.96
        },
        "1535117400": {
            "date": "24-08-2018",
            "open": 13.3,
            "high": 13.42,
            "low": 13.14,
            "close": 13.27,
            "adjclose": 12.93
        },
        "1535376600": {
            "date": "27-08-2018",
            "open": 13.32,
            "high": 13.88,
            "low": 13.23,
            "close": 13.83,
            "adjclose": 13.48
        },
        "1535463000": {
            "date": "28-08-2018",
            "open": 13.9,
            "high": 13.98,
            "low": 13.5,
            "close": 13.56,
            "adjclose": 13.22
        },
        "1535549400": {
            "date": "29-08-2018",
            "open": 13.54,
            "high": 13.83,
            "low": 13.54,
            "close": 13.78,
            "adjclose": 13.43
        },
        "1535635800": {
            "date": "30-08-2018",
            "open": 13.75,
            "high": 13.83,
            "low": 13.5,
            "close": 13.68,
            "adjclose": 13.33
        },
        "1535722200": {
            "date": "31-08-2018",
            "open": 13.63,
            "high": 13.69,
            "low": 13.48,
            "close": 13.53,
            "adjclose": 13.19
        },
        "1535981400": {
            "date": "03-09-2018",
            "open": 13.46,
            "high": 13.63,
            "low": 13.34,
            "close": 13.39,
            "adjclose": 13.05
        },
        "1536067800": {
            "date": "04-09-2018",
            "open": 13.41,
            "high": 13.59,
            "low": 13.25,
            "close": 13.41,
            "adjclose": 13.07
        },
        "1536154200": {
            "date": "05-09-2018",
            "open": 13.39,
            "high": 13.41,
            "low": 13.1,
            "close": 13.13,
            "adjclose": 12.8
        },
        "1536240600": {
            "date": "06-09-2018",
            "open": 13.2,
            "high": 13.35,
            "low": 13.05,
            "close": 13.07,
            "adjclose": 12.74
        },
        "1536327000": {
            "date": "07-09-2018",
            "open": 13.05,
            "high": 13.2,
            "low": 12.87,
            "close": 13.17,
            "adjclose": 12.84
        },
        "1536586200": {
            "date": "10-09-2018",
            "open": 13.22,
            "high": 13.22,
            "low": 12.9,
            "close": 13.11,
            "adjclose": 12.78
        },
        "1536672600": {
            "date": "11-09-2018",
            "open": 13.05,
            "high": 13.2,
            "low": 12.96,
            "close": 13.11,
            "adjclose": 12.78
        },
        "1536759000": {
            "date": "12-09-2018",
            "open": 13.04,
            "high": 13.4,
            "low": 13.04,
            "close": 13.31,
            "adjclose": 12.97
        },
        "1536845400": {
            "date": "13-09-2018",
            "open": 13.3,
            "high": 13.49,
            "low": 13.29,
            "close": 13.34,
            "adjclose": 13
        },
        "1536931800": {
            "date": "14-09-2018",
            "open": 13.22,
            "high": 13.5,
            "low": 13.2,
            "close": 13.44,
            "adjclose": 13.1
        },
        "1537191000": {
            "date": "17-09-2018",
            "open": 13.45,
            "high": 13.66,
            "low": 13.33,
            "close": 13.38,
            "adjclose": 13.04
        },
        "1537277400": {
            "date": "18-09-2018",
            "open": 13.33,
            "high": 13.6,
            "low": 13.33,
            "close": 13.58,
            "adjclose": 13.24
        },
        "1537363800": {
            "date": "19-09-2018",
            "open": 13.55,
            "high": 13.75,
            "low": 13.47,
            "close": 13.49,
            "adjclose": 13.15
        },
        "1537450200": {
            "date": "20-09-2018",
            "open": 13.52,
            "high": 13.67,
            "low": 13.42,
            "close": 13.48,
            "adjclose": 13.14
        },
        "1537536600": {
            "date": "21-09-2018",
            "open": 13.47,
            "high": 13.47,
            "low": 13.22,
            "close": 13.28,
            "adjclose": 12.94
        },
        "1537795800": {
            "date": "24-09-2018",
            "open": 13.28,
            "high": 13.32,
            "low": 13.06,
            "close": 13.13,
            "adjclose": 12.8
        },
        "1537882200": {
            "date": "25-09-2018",
            "open": 13.19,
            "high": 13.3,
            "low": 13.12,
            "close": 13.15,
            "adjclose": 12.82
        },
        "1537968600": {
            "date": "26-09-2018",
            "open": 13.15,
            "high": 13.31,
            "low": 13.05,
            "close": 13.07,
            "adjclose": 12.74
        },
        "1538055000": {
            "date": "27-09-2018",
            "open": 13.1,
            "high": 13.35,
            "low": 13.1,
            "close": 13.32,
            "adjclose": 12.98
        },
        "1538141400": {
            "date": "28-09-2018",
            "open": 13.23,
            "high": 13.36,
            "low": 13.01,
            "close": 13.14,
            "adjclose": 12.81
        },
        "1538400600": {
            "date": "01-10-2018",
            "open": 13.21,
            "high": 13.52,
            "low": 13.19,
            "close": 13.36,
            "adjclose": 13.02
        },
        "1538487000": {
            "date": "02-10-2018",
            "open": 13.33,
            "high": 13.44,
            "low": 13.1,
            "close": 13.12,
            "adjclose": 12.79
        },
        "1538573400": {
            "date": "03-10-2018",
            "open": 13.12,
            "high": 13.22,
            "low": 12.95,
            "close": 12.99,
            "adjclose": 12.66
        },
        "1538659800": {
            "date": "04-10-2018",
            "open": 13.02,
            "high": 13.02,
            "low": 12.55,
            "close": 12.66,
            "adjclose": 12.34
        },
        "1538746200": {
            "date": "05-10-2018",
            "open": 12.66,
            "high": 12.66,
            "low": 12.1,
            "close": 12.13,
            "adjclose": 11.82
        },
        "1539005400": {
            "date": "08-10-2018",
            "open": 12.1,
            "high": 12.11,
            "low": 11.85,
            "close": 12.06,
            "adjclose": 11.76
        },
        "1539091800": {
            "date": "09-10-2018",
            "open": 12.05,
            "high": 12.21,
            "low": 11.81,
            "close": 12.18,
            "adjclose": 11.87
        },
        "1539178200": {
            "date": "10-10-2018",
            "open": 12.18,
            "high": 12.18,
            "low": 11.9,
            "close": 11.93,
            "adjclose": 11.63
        },
        "1539264600": {
            "date": "11-10-2018",
            "open": 11.91,
            "high": 12.03,
            "low": 11.55,
            "close": 11.6,
            "adjclose": 11.31
        },
        "1539351000": {
            "date": "12-10-2018",
            "open": 11.79,
            "high": 11.93,
            "low": 11.57,
            "close": 11.77,
            "adjclose": 11.47
        },
        "1539610200": {
            "date": "15-10-2018",
            "open": 11.83,
            "high": 12.1,
            "low": 11.68,
            "close": 11.99,
            "adjclose": 11.69
        },
        "1539696600": {
            "date": "16-10-2018",
            "open": 12.05,
            "high": 12.29,
            "low": 11.92,
            "close": 12.1,
            "adjclose": 11.79
        },
        "1539783000": {
            "date": "17-10-2018",
            "open": 12.09,
            "high": 12.18,
            "low": 11.78,
            "close": 11.83,
            "adjclose": 11.53
        },
        "1539869400": {
            "date": "18-10-2018",
            "open": 11.99,
            "high": 11.99,
            "low": 11.26,
            "close": 11.32,
            "adjclose": 11.03
        },
        "1539955800": {
            "date": "19-10-2018",
            "open": 11.36,
            "high": 11.49,
            "low": 11.24,
            "close": 11.4,
            "adjclose": 11.11
        },
        "1540215000": {
            "date": "22-10-2018",
            "open": 11.42,
            "high": 11.57,
            "low": 11,
            "close": 11.02,
            "adjclose": 10.74
        },
        "1540301400": {
            "date": "23-10-2018",
            "open": 10.86,
            "high": 10.94,
            "low": 10.65,
            "close": 10.76,
            "adjclose": 10.49
        },
        "1540387800": {
            "date": "24-10-2018",
            "open": 10.77,
            "high": 10.88,
            "low": 10.54,
            "close": 10.58,
            "adjclose": 10.31
        },
        "1540474200": {
            "date": "25-10-2018",
            "open": 10.69,
            "high": 11.28,
            "low": 10.33,
            "close": 10.42,
            "adjclose": 10.16
        },
        "1540560600": {
            "date": "26-10-2018",
            "open": 10.38,
            "high": 10.38,
            "low": 9.85,
            "close": 10.24,
            "adjclose": 9.98
        },
        "1540823400": {
            "date": "29-10-2018",
            "open": 10.11,
            "high": 10.41,
            "low": 9.5,
            "close": 9.76,
            "adjclose": 9.51
        },
        "1540909800": {
            "date": "30-10-2018",
            "open": 9.76,
            "high": 10.3,
            "low": 9.64,
            "close": 10.12,
            "adjclose": 9.86
        },
        "1540996200": {
            "date": "31-10-2018",
            "open": 10.21,
            "high": 10.6,
            "low": 10,
            "close": 10.14,
            "adjclose": 9.88
        },
        "1541082600": {
            "date": "01-11-2018",
            "open": 10.2,
            "high": 10.93,
            "low": 10.16,
            "close": 10.88,
            "adjclose": 10.61
        },
        "1541428200": {
            "date": "05-11-2018",
            "open": 10.87,
            "high": 11.22,
            "low": 10.77,
            "close": 10.99,
            "adjclose": 10.71
        },
        "1541514600": {
            "date": "06-11-2018",
            "open": 11.03,
            "high": 11.33,
            "low": 10.86,
            "close": 11.06,
            "adjclose": 10.78
        },
        "1541601000": {
            "date": "07-11-2018",
            "open": 11.14,
            "high": 11.47,
            "low": 11.1,
            "close": 11.22,
            "adjclose": 10.94
        },
        "1541687400": {
            "date": "08-11-2018",
            "open": 11.17,
            "high": 11.24,
            "low": 10.53,
            "close": 10.66,
            "adjclose": 10.39
        },
        "1541773800": {
            "date": "09-11-2018",
            "open": 10.66,
            "high": 10.74,
            "low": 10.02,
            "close": 10.71,
            "adjclose": 10.44
        },
        "1542033000": {
            "date": "12-11-2018",
            "open": 10.76,
            "high": 10.76,
            "low": 10.15,
            "close": 10.24,
            "adjclose": 9.98
        },
        "1542119400": {
            "date": "13-11-2018",
            "open": 10.29,
            "high": 10.46,
            "low": 10.03,
            "close": 10.09,
            "adjclose": 9.84
        },
        "1542205800": {
            "date": "14-11-2018",
            "open": 10.07,
            "high": 10.53,
            "low": 10.03,
            "close": 10.08,
            "adjclose": 9.83
        },
        "1542292200": {
            "date": "15-11-2018",
            "open": 10.03,
            "high": 10.32,
            "low": 9.96,
            "close": 10,
            "adjclose": 9.75
        },
        "1542378600": {
            "date": "16-11-2018",
            "open": 10,
            "high": 10.31,
            "low": 9.98,
            "close": 10.14,
            "adjclose": 9.88
        },
        "1542724200": {
            "date": "20-11-2018",
            "open": 9.95,
            "high": 10.27,
            "low": 9.89,
            "close": 9.94,
            "adjclose": 9.69
        },
        "1542810600": {
            "date": "21-11-2018",
            "open": 9.99,
            "high": 10.2,
            "low": 9.35,
            "close": 9.42,
            "adjclose": 9.18
        },
        "1542897000": {
            "date": "22-11-2018",
            "open": 9.47,
            "high": 9.49,
            "low": 8.94,
            "close": 9.07,
            "adjclose": 8.84
        },
        "1542983400": {
            "date": "23-11-2018",
            "open": 9.23,
            "high": 9.68,
            "low": 9.21,
            "close": 9.51,
            "adjclose": 9.27
        },
        "1543242600": {
            "date": "26-11-2018",
            "open": 9.67,
            "high": 9.89,
            "low": 9.15,
            "close": 9.31,
            "adjclose": 9.07
        },
        "1543329000": {
            "date": "27-11-2018",
            "open": 9.34,
            "high": 9.55,
            "low": 9.21,
            "close": 9.5,
            "adjclose": 9.26
        },
        "1543415400": {
            "date": "28-11-2018",
            "open": 9.61,
            "high": 9.97,
            "low": 9.46,
            "close": 9.94,
            "adjclose": 9.69
        },
        "1543501800": {
            "date": "29-11-2018",
            "open": 10.02,
            "high": 10.52,
            "low": 10.01,
            "close": 10.36,
            "adjclose": 10.1
        },
        "1543588200": {
            "date": "30-11-2018",
            "open": 10.41,
            "high": 10.51,
            "low": 10.15,
            "close": 10.47,
            "adjclose": 10.21
        },
        "1543847400": {
            "date": "03-12-2018",
            "open": 10.62,
            "high": 10.81,
            "low": 10.3,
            "close": 10.47,
            "adjclose": 10.21
        },
        "1543933800": {
            "date": "04-12-2018",
            "open": 10.46,
            "high": 10.68,
            "low": 10,
            "close": 10.03,
            "adjclose": 9.78
        },
        "1544020200": {
            "date": "05-12-2018",
            "open": 10.12,
            "high": 10.17,
            "low": 10.04,
            "close": 10.09,
            "adjclose": 9.84
        },
        "1544106600": {
            "date": "06-12-2018",
            "open": 9.91,
            "high": 10.13,
            "low": 9.75,
            "close": 10.09,
            "adjclose": 9.84
        },
        "1544193000": {
            "date": "07-12-2018",
            "open": 10.14,
            "high": 10.4,
            "low": 10.14,
            "close": 10.19,
            "adjclose": 9.93
        },
        "1544452200": {
            "date": "10-12-2018",
            "open": 10.15,
            "high": 10.15,
            "low": 9.67,
            "close": 9.69,
            "adjclose": 9.45
        },
        "1544538600": {
            "date": "11-12-2018",
            "open": 9.82,
            "high": 9.88,
            "low": 9.47,
            "close": 9.56,
            "adjclose": 9.32
        },
        "1544711400": {
            "date": "13-12-2018",
            "open": 9.59,
            "high": 9.7,
            "low": 9.4,
            "close": 9.42,
            "adjclose": 9.18
        },
        "1544797800": {
            "date": "14-12-2018",
            "open": 9.43,
            "high": 9.59,
            "low": 9.26,
            "close": 9.48,
            "adjclose": 9.24
        },
        "1545057000": {
            "date": "17-12-2018",
            "open": 9.46,
            "high": 9.61,
            "low": 9.37,
            "close": 9.43,
            "adjclose": 9.19
        },
        "1545143400": {
            "date": "18-12-2018",
            "open": 9.51,
            "high": 9.83,
            "low": 9.46,
            "close": 9.69,
            "adjclose": 9.45
        },
        "1545229800": {
            "date": "19-12-2018",
            "open": 9.69,
            "high": 10.2,
            "low": 9.69,
            "close": 9.77,
            "adjclose": 9.52
        },
        "1545316200": {
            "date": "20-12-2018",
            "open": 9.86,
            "high": 10.01,
            "low": 9.56,
            "close": 9.62,
            "adjclose": 9.38
        },
        "1545402600": {
            "date": "21-12-2018",
            "open": 9.57,
            "high": 9.72,
            "low": 9.44,
            "close": 9.55,
            "adjclose": 9.31
        },
        "1545661800": {
            "date": "24-12-2018",
            "open": 9.51,
            "high": 9.63,
            "low": 9.37,
            "close": 9.42,
            "adjclose": 9.18
        },
        "1545834600": {
            "date": "26-12-2018",
            "open": 9.4,
            "high": 9.55,
            "low": 9.26,
            "close": 9.5,
            "adjclose": 9.26
        },
        "1545921000": {
            "date": "27-12-2018",
            "open": 9.46,
            "high": 9.49,
            "low": 9.25,
            "close": 9.47,
            "adjclose": 9.23
        },
        "1546007400": {
            "date": "28-12-2018",
            "open": 9.47,
            "high": 9.55,
            "low": 9.42,
            "close": 9.46,
            "adjclose": 9.22
        },
        "1546266600": {
            "date": "31-12-2018",
            "open": 9.47,
            "high": 9.61,
            "low": 9.37,
            "close": 9.49,
            "adjclose": 9.25
        },
        "1546439400": {
            "date": "02-01-2019",
            "open": 9.45,
            "high": 9.79,
            "low": 9.44,
            "close": 9.77,
            "adjclose": 9.52
        },
        "1546525800": {
            "date": "03-01-2019",
            "open": 9.71,
            "high": 9.77,
            "low": 9.49,
            "close": 9.58,
            "adjclose": 9.34
        },
        "1546612200": {
            "date": "04-01-2019",
            "open": 9.64,
            "high": 9.79,
            "low": 9.5,
            "close": 9.61,
            "adjclose": 9.37
        },
        "1546871400": {
            "date": "07-01-2019",
            "open": 9.63,
            "high": 9.93,
            "low": 9.48,
            "close": 9.89,
            "adjclose": 9.64
        },
        "1546957800": {
            "date": "08-01-2019",
            "open": 9.95,
            "high": 10.14,
            "low": 9.9,
            "close": 10.11,
            "adjclose": 9.85
        },
        "1547044200": {
            "date": "09-01-2019",
            "open": 10.12,
            "high": 10.4,
            "low": 10.1,
            "close": 10.2,
            "adjclose": 9.94
        },
        "1547130600": {
            "date": "10-01-2019",
            "open": 10.24,
            "high": 10.27,
            "low": 10.05,
            "close": 10.16,
            "adjclose": 9.9
        },
        "1547217000": {
            "date": "11-01-2019",
            "open": 10.17,
            "high": 10.17,
            "low": 9.94,
            "close": 10.04,
            "adjclose": 9.79
        },
        "1547476200": {
            "date": "14-01-2019",
            "open": 10.03,
            "high": 10.13,
            "low": 9.87,
            "close": 9.95,
            "adjclose": 9.7
        },
        "1547562600": {
            "date": "15-01-2019",
            "open": 9.93,
            "high": 10.01,
            "low": 9.85,
            "close": 9.93,
            "adjclose": 9.68
        },
        "1547649000": {
            "date": "16-01-2019",
            "open": 9.91,
            "high": 10.21,
            "low": 9.89,
            "close": 10.19,
            "adjclose": 9.93
        },
        "1547735400": {
            "date": "17-01-2019",
            "open": 10.2,
            "high": 10.44,
            "low": 10.18,
            "close": 10.4,
            "adjclose": 10.14
        },
        "1547821800": {
            "date": "18-01-2019",
            "open": 10.45,
            "high": 10.78,
            "low": 10.36,
            "close": 10.68,
            "adjclose": 10.41
        },
        "1548081000": {
            "date": "21-01-2019",
            "open": 10.7,
            "high": 10.72,
            "low": 10.53,
            "close": 10.59,
            "adjclose": 10.32
        },
        "1548167400": {
            "date": "22-01-2019",
            "open": 10.61,
            "high": 10.65,
            "low": 10.3,
            "close": 10.39,
            "adjclose": 10.13
        },
        "1548253800": {
            "date": "23-01-2019",
            "open": 10.36,
            "high": 10.47,
            "low": 9.9,
            "close": 9.99,
            "adjclose": 9.74
        },
        "1548340200": {
            "date": "24-01-2019",
            "open": 10.03,
            "high": 10.2,
            "low": 9.98,
            "close": 10,
            "adjclose": 9.75
        },
        "1548426600": {
            "date": "25-01-2019",
            "open": 10.06,
            "high": 10.23,
            "low": 10.06,
            "close": 10.1,
            "adjclose": 9.84
        },
        "1548685800": {
            "date": "28-01-2019",
            "open": 10.1,
            "high": 10.18,
            "low": 9.99,
            "close": 10.13,
            "adjclose": 9.87
        },
        "1548772200": {
            "date": "29-01-2019",
            "open": 10.18,
            "high": 10.25,
            "low": 10.05,
            "close": 10.08,
            "adjclose": 9.83
        },
        "1548858600": {
            "date": "30-01-2019",
            "open": 10.1,
            "high": 10.28,
            "low": 9.96,
            "close": 10.23,
            "adjclose": 9.97
        },
        "1548945000": {
            "date": "31-01-2019",
            "open": 10.25,
            "high": 10.46,
            "low": 10.15,
            "close": 10.33,
            "adjclose": 10.07
        },
        "1549031400": {
            "date": "01-02-2019",
            "open": 10.38,
            "high": 10.44,
            "low": 10.16,
            "close": 10.2,
            "adjclose": 9.94
        },
        "1549377000": {
            "date": "05-02-2019",
            "open": 10.18,
            "high": 10.5,
            "low": 10.18,
            "close": 10.49,
            "adjclose": 10.23
        },
        "1549463400": {
            "date": "06-02-2019",
            "open": 10.51,
            "high": 10.55,
            "low": 10.12,
            "close": 10.15,
            "adjclose": 9.89
        },
        "1549549800": {
            "date": "07-02-2019",
            "open": 10.15,
            "high": 10.2,
            "low": 9.42,
            "close": 9.46,
            "adjclose": 9.22
        },
        "1549636200": {
            "date": "08-02-2019",
            "open": 9.48,
            "high": 9.48,
            "low": 9.14,
            "close": 9.31,
            "adjclose": 9.07
        },
        "1549895400": {
            "date": "11-02-2019",
            "open": 9.31,
            "high": 9.5,
            "low": 9.18,
            "close": 9.46,
            "adjclose": 9.22
        },
        "1549981800": {
            "date": "12-02-2019",
            "open": 9.49,
            "high": 9.68,
            "low": 9.46,
            "close": 9.63,
            "adjclose": 9.39
        },
        "1550068200": {
            "date": "13-02-2019",
            "open": 9.61,
            "high": 9.76,
            "low": 9.31,
            "close": 9.36,
            "adjclose": 9.12
        },
        "1550154600": {
            "date": "14-02-2019",
            "open": 9.42,
            "high": 9.53,
            "low": 9.24,
            "close": 9.5,
            "adjclose": 9.26
        },
        "1550241000": {
            "date": "15-02-2019",
            "open": 9.53,
            "high": 9.62,
            "low": 9.44,
            "close": 9.5,
            "adjclose": 9.26
        },
        "1550500200": {
            "date": "18-02-2019",
            "open": 9.53,
            "high": 9.67,
            "low": 9.51,
            "close": 9.55,
            "adjclose": 9.31
        },
        "1550586600": {
            "date": "19-02-2019",
            "open": 9.55,
            "high": 9.63,
            "low": 9.4,
            "close": 9.42,
            "adjclose": 9.18
        },
        "1550673000": {
            "date": "20-02-2019",
            "open": 9.67,
            "high": 9.88,
            "low": 9.59,
            "close": 9.72,
            "adjclose": 9.47
        },
        "1550759400": {
            "date": "21-02-2019",
            "open": 9.67,
            "high": 9.72,
            "low": 9.6,
            "close": 9.67,
            "adjclose": 9.43
        },
        "1550845800": {
            "date": "22-02-2019",
            "open": 9.69,
            "high": 9.72,
            "low": 9.51,
            "close": 9.58,
            "adjclose": 9.34
        },
        "1551105000": {
            "date": "25-02-2019",
            "open": 9.6,
            "high": 9.64,
            "low": 9.35,
            "close": 9.44,
            "adjclose": 9.2
        },
        "1551191400": {
            "date": "26-02-2019",
            "open": 9.49,
            "high": 9.55,
            "low": 9.41,
            "close": 9.53,
            "adjclose": 9.29
        },
        "1551277800": {
            "date": "27-02-2019",
            "open": 9.53,
            "high": 9.54,
            "low": 9.36,
            "close": 9.39,
            "adjclose": 9.15
        },
        "1551364200": {
            "date": "28-02-2019",
            "open": 9.35,
            "high": 9.54,
            "low": 9.17,
            "close": 9.46,
            "adjclose": 9.22
        },
        "1551450600": {
            "date": "01-03-2019",
            "open": 9.49,
            "high": 9.55,
            "low": 9.22,
            "close": 9.44,
            "adjclose": 9.2
        },
        "1551709800": {
            "date": "04-03-2019",
            "open": 9.39,
            "high": 9.49,
            "low": 9.24,
            "close": 9.34,
            "adjclose": 9.1
        },
        "1551796200": {
            "date": "05-03-2019",
            "open": 9.33,
            "high": 9.33,
            "low": 9.14,
            "close": 9.17,
            "adjclose": 8.94
        },
        "1551882600": {
            "date": "06-03-2019",
            "open": 9.16,
            "high": 9.29,
            "low": 9.05,
            "close": 9.18,
            "adjclose": 8.95
        },
        "1551969000": {
            "date": "07-03-2019",
            "open": 9.2,
            "high": 9.2,
            "low": 9,
            "close": 9.09,
            "adjclose": 8.86
        },
        "1552055400": {
            "date": "08-03-2019",
            "open": 9.07,
            "high": 9.14,
            "low": 8.96,
            "close": 9.03,
            "adjclose": 8.8
        },
        "1552314600": {
            "date": "11-03-2019",
            "open": 9.02,
            "high": 9.22,
            "low": 9.02,
            "close": 9.2,
            "adjclose": 8.97
        },
        "1552401000": {
            "date": "12-03-2019",
            "open": 9.2,
            "high": 9.26,
            "low": 9.09,
            "close": 9.13,
            "adjclose": 8.9
        },
        "1552487400": {
            "date": "13-03-2019",
            "open": 9.17,
            "high": 9.18,
            "low": 9.05,
            "close": 9.13,
            "adjclose": 8.9
        },
        "1552573800": {
            "date": "14-03-2019",
            "open": 9.17,
            "high": 9.19,
            "low": 8.95,
            "close": 9.03,
            "adjclose": 8.8
        },
        "1552660200": {
            "date": "15-03-2019",
            "open": 9.05,
            "high": 9.19,
            "low": 9.03,
            "close": 9.16,
            "adjclose": 8.93
        },
        "1553005800": {
            "date": "19-03-2019",
            "open": 9.2,
            "high": 9.41,
            "low": 9.2,
            "close": 9.29,
            "adjclose": 9.06
        },
        "1553092200": {
            "date": "20-03-2019",
            "open": 9.32,
            "high": 9.41,
            "low": 9.1,
            "close": 9.39,
            "adjclose": 9.15
        },
        "1553178600": {
            "date": "21-03-2019",
            "open": 9.35,
            "high": 9.55,
            "low": 9.22,
            "close": 9.32,
            "adjclose": 9.08
        },
        "1553265000": {
            "date": "22-03-2019",
            "open": 9.25,
            "high": 9.28,
            "low": 8.71,
            "close": 8.75,
            "adjclose": 8.53
        },
        "1553524200": {
            "date": "25-03-2019",
            "open": 8.8,
            "high": 9.17,
            "low": 8.76,
            "close": 9.13,
            "adjclose": 8.9
        },
        "1553610600": {
            "date": "26-03-2019",
            "open": 9.13,
            "high": 9.19,
            "low": 8.94,
            "close": 9,
            "adjclose": 8.77
        },
        "1553697000": {
            "date": "27-03-2019",
            "open": 9.05,
            "high": 9.22,
            "low": 9.01,
            "close": 9.2,
            "adjclose": 8.97
        },
        "1553783400": {
            "date": "28-03-2019",
            "open": 9.2,
            "high": 9.23,
            "low": 8.85,
            "close": 8.88,
            "adjclose": 8.66
        },
        "1553869800": {
            "date": "29-03-2019",
            "open": 8.95,
            "high": 9.13,
            "low": 8.82,
            "close": 9.07,
            "adjclose": 8.84
        },
        "1554129000": {
            "date": "01-04-2019",
            "open": 9.07,
            "high": 9.21,
            "low": 9.07,
            "close": 9.19,
            "adjclose": 8.96
        },
        "1554215400": {
            "date": "02-04-2019",
            "open": 9.01,
            "high": 9.19,
            "low": 8.96,
            "close": 9.15,
            "adjclose": 8.92
        },
        "1554301800": {
            "date": "03-04-2019",
            "open": 9.16,
            "high": 9.3,
            "low": 9.16,
            "close": 9.26,
            "adjclose": 9.03
        },
        "1554388200": {
            "date": "04-04-2019",
            "open": 9.28,
            "high": 9.45,
            "low": 9.17,
            "close": 9.36,
            "adjclose": 9.12
        },
        "1554474600": {
            "date": "05-04-2019",
            "open": 9.36,
            "high": 9.52,
            "low": 9.33,
            "close": 9.5,
            "adjclose": 9.26
        },
        "1554730200": {
            "date": "08-04-2019",
            "open": 9.48,
            "high": 9.74,
            "low": 9.4,
            "close": 9.71,
            "adjclose": 9.46
        },
        "1554816600": {
            "date": "09-04-2019",
            "open": 9.68,
            "high": 9.68,
            "low": 9.42,
            "close": 9.46,
            "adjclose": 9.22
        },
        "1554903000": {
            "date": "10-04-2019",
            "open": 9.46,
            "high": 9.46,
            "low": 9.31,
            "close": 9.38,
            "adjclose": 9.14
        },
        "1554989400": {
            "date": "11-04-2019",
            "open": 9.38,
            "high": 9.38,
            "low": 9.01,
            "close": 9.04,
            "adjclose": 8.81
        },
        "1555075800": {
            "date": "12-04-2019",
            "open": 9.08,
            "high": 9.12,
            "low": 8.91,
            "close": 9.01,
            "adjclose": 8.78
        },
        "1555335000": {
            "date": "15-04-2019",
            "open": 9.01,
            "high": 9.2,
            "low": 8.92,
            "close": 9.07,
            "adjclose": 8.84
        },
        "1555421400": {
            "date": "16-04-2019",
            "open": 9.06,
            "high": 9.21,
            "low": 9.06,
            "close": 9.18,
            "adjclose": 8.95
        },
        "1555507800": {
            "date": "17-04-2019",
            "open": 9.2,
            "high": 9.32,
            "low": 9.11,
            "close": 9.24,
            "adjclose": 9.01
        },
        "1555939800": {
            "date": "22-04-2019",
            "open": 9.23,
            "high": 9.23,
            "low": 9.12,
            "close": 9.15,
            "adjclose": 8.92
        },
        "1556026200": {
            "date": "23-04-2019",
            "open": 9.13,
            "high": 9.19,
            "low": 8.95,
            "close": 9.06,
            "adjclose": 8.83
        },
        "1556112600": {
            "date": "24-04-2019",
            "open": 9.08,
            "high": 9.2,
            "low": 9.02,
            "close": 9.19,
            "adjclose": 8.96
        },
        "1556199000": {
            "date": "25-04-2019",
            "open": 9.21,
            "high": 9.21,
            "low": 8.79,
            "close": 8.82,
            "adjclose": 8.6
        },
        "1556285400": {
            "date": "26-04-2019",
            "open": 8.84,
            "high": 8.85,
            "low": 8.72,
            "close": 8.77,
            "adjclose": 8.55
        },
        "1556544600": {
            "date": "29-04-2019",
            "open": 8.77,
            "high": 8.83,
            "low": 8.66,
            "close": 8.7,
            "adjclose": 8.48
        },
        "1556631000": {
            "date": "30-04-2019",
            "open": 8.72,
            "high": 8.82,
            "low": 8.66,
            "close": 8.77,
            "adjclose": 8.55
        },
        "1556803800": {
            "date": "02-05-2019",
            "open": 8.77,
            "high": 8.84,
            "low": 8.63,
            "close": 8.71,
            "adjclose": 8.49
        },
        "1556890200": {
            "date": "03-05-2019",
            "open": 8.72,
            "high": 8.83,
            "low": 8.71,
            "close": 8.81,
            "adjclose": 8.59
        },
        "1557149400": {
            "date": "06-05-2019",
            "open": 8.76,
            "high": 8.85,
            "low": 8.67,
            "close": 8.76,
            "adjclose": 8.54
        },
        "1557235800": {
            "date": "07-05-2019",
            "open": 8.73,
            "high": 8.75,
            "low": 8.6,
            "close": 8.62,
            "adjclose": 8.4
        },
        "1557322200": {
            "date": "08-05-2019",
            "open": 8.63,
            "high": 8.7,
            "low": 8.59,
            "close": 8.62,
            "adjclose": 8.4
        },
        "1557408600": {
            "date": "09-05-2019",
            "open": 8.56,
            "high": 8.72,
            "low": 8.51,
            "close": 8.69,
            "adjclose": 8.47
        },
        "1557495000": {
            "date": "10-05-2019",
            "open": 8.66,
            "high": 8.72,
            "low": 8.5,
            "close": 8.59,
            "adjclose": 8.37
        },
        "1557754200": {
            "date": "13-05-2019",
            "open": 8.54,
            "high": 8.54,
            "low": 8.28,
            "close": 8.3,
            "adjclose": 8.09
        },
        "1557840600": {
            "date": "14-05-2019",
            "open": 8.32,
            "high": 8.6,
            "low": 8.32,
            "close": 8.38,
            "adjclose": 8.17
        },
        "1557927000": {
            "date": "15-05-2019",
            "open": 8.35,
            "high": 8.49,
            "low": 8.34,
            "close": 8.4,
            "adjclose": 8.19
        },
        "1558013400": {
            "date": "16-05-2019",
            "open": 8.39,
            "high": 8.52,
            "low": 8.35,
            "close": 8.41,
            "adjclose": 8.2
        },
        "1558099800": {
            "date": "17-05-2019",
            "open": 8.38,
            "high": 8.45,
            "low": 8.34,
            "close": 8.38,
            "adjclose": 8.17
        },
        "1558359000": {
            "date": "20-05-2019",
            "open": 8.36,
            "high": 8.45,
            "low": 8.29,
            "close": 8.37,
            "adjclose": 8.16
        },
        "1558445400": {
            "date": "21-05-2019",
            "open": 8.41,
            "high": 8.44,
            "low": 8.28,
            "close": 8.3,
            "adjclose": 8.09
        },
        "1558531800": {
            "date": "22-05-2019",
            "open": 8.3,
            "high": 8.31,
            "low": 8.17,
            "close": 8.24,
            "adjclose": 8.03
        },
        "1558618200": {
            "date": "23-05-2019",
            "open": 8.18,
            "high": 8.24,
            "low": 8.02,
            "close": 8.2,
            "adjclose": 7.99
        },
        "1558704600": {
            "date": "24-05-2019",
            "open": 8.24,
            "high": 8.25,
            "low": 8,
            "close": 8.02,
            "adjclose": 7.82
        },
        "1558963800": {
            "date": "27-05-2019",
            "open": 8.02,
            "high": 8.03,
            "low": 7.9,
            "close": 7.92,
            "adjclose": 7.72
        },
        "1559050200": {
            "date": "28-05-2019",
            "open": 7.94,
            "high": 7.99,
            "low": 7.57,
            "close": 7.65,
            "adjclose": 7.46
        },
        "1559136600": {
            "date": "29-05-2019",
            "open": 7.62,
            "high": 8.01,
            "low": 7.59,
            "close": 7.98,
            "adjclose": 7.78
        },
        "1559223000": {
            "date": "30-05-2019",
            "open": 8.04,
            "high": 8.24,
            "low": 7.93,
            "close": 8.09,
            "adjclose": 7.89
        },
        "1559309400": {
            "date": "31-05-2019",
            "open": 7.85,
            "high": 8.12,
            "low": 7.79,
            "close": 7.99,
            "adjclose": 7.79
        },
        "1559568600": {
            "date": "03-06-2019",
            "open": 8.01,
            "high": 8.24,
            "low": 7.99,
            "close": 8.12,
            "adjclose": 7.91
        },
        "1559655000": {
            "date": "04-06-2019",
            "open": 8.18,
            "high": 8.48,
            "low": 8.13,
            "close": 8.29,
            "adjclose": 8.08
        },
        "1559741400": {
            "date": "05-06-2019",
            "open": 8.33,
            "high": 8.4,
            "low": 8.13,
            "close": 8.19,
            "adjclose": 7.98
        },
        "1559827800": {
            "date": "06-06-2019",
            "open": 8.17,
            "high": 8.24,
            "low": 7.95,
            "close": 8.02,
            "adjclose": 7.82
        },
        "1559914200": {
            "date": "07-06-2019",
            "open": 8.04,
            "high": 8.18,
            "low": 8.04,
            "close": 8.1,
            "adjclose": 7.9
        },
        "1560173400": {
            "date": "10-06-2019",
            "open": 8.15,
            "high": 8.5,
            "low": 8.14,
            "close": 8.39,
            "adjclose": 8.18
        },
        "1560259800": {
            "date": "11-06-2019",
            "open": 8.44,
            "high": 8.45,
            "low": 8.1,
            "close": 8.11,
            "adjclose": 7.91
        },
        "1560346200": {
            "date": "12-06-2019",
            "open": 8.15,
            "high": 8.15,
            "low": 7.98,
            "close": 8.02,
            "adjclose": 7.82
        },
        "1560432600": {
            "date": "13-06-2019",
            "open": 7.97,
            "high": 8.17,
            "low": 7.89,
            "close": 8.02,
            "adjclose": 7.91
        },
        "1560519000": {
            "date": "14-06-2019",
            "open": 8,
            "high": 8.01,
            "low": 7.81,
            "close": 7.91,
            "adjclose": 7.8
        },
        "1560778200": {
            "date": "17-06-2019",
            "open": 7.94,
            "high": 7.96,
            "low": 7.8,
            "close": 7.86,
            "adjclose": 7.75
        },
        "1560864600": {
            "date": "18-06-2019",
            "open": 7.9,
            "high": 8.02,
            "low": 7.9,
            "close": 7.94,
            "adjclose": 7.83
        },
        "1560951000": {
            "date": "19-06-2019",
            "open": 7.93,
            "high": 7.98,
            "low": 7.85,
            "close": 7.92,
            "adjclose": 7.81
        },
        "1561037400": {
            "date": "20-06-2019",
            "open": 7.99,
            "high": 8.05,
            "low": 7.81,
            "close": 7.83,
            "adjclose": 7.72
        },
        "1561123800": {
            "date": "21-06-2019",
            "open": 7.8,
            "high": 8,
            "low": 7.75,
            "close": 7.96,
            "adjclose": 7.85
        },
        "1561383000": {
            "date": "24-06-2019",
            "open": 8,
            "high": 8.04,
            "low": 7.93,
            "close": 8,
            "adjclose": 7.89
        },
        "1561469400": {
            "date": "25-06-2019",
            "open": 7.99,
            "high": 8,
            "low": 7.85,
            "close": 7.95,
            "adjclose": 7.84
        },
        "1561555800": {
            "date": "26-06-2019",
            "open": 7.97,
            "high": 8.04,
            "low": 7.86,
            "close": 8,
            "adjclose": 7.89
        },
        "1561642200": {
            "date": "27-06-2019",
            "open": 8.01,
            "high": 8.14,
            "low": 7.95,
            "close": 8.02,
            "adjclose": 7.91
        },
        "1561728600": {
            "date": "28-06-2019",
            "open": 8.06,
            "high": 8.12,
            "low": 7.93,
            "close": 8.09,
            "adjclose": 7.98
        },
        "1561987800": {
            "date": "01-07-2019",
            "open": 8.14,
            "high": 8.19,
            "low": 8,
            "close": 8.15,
            "adjclose": 8.04
        },
        "1562074200": {
            "date": "02-07-2019",
            "open": 8.16,
            "high": 8.23,
            "low": 8.07,
            "close": 8.12,
            "adjclose": 8.01
        },
        "1562160600": {
            "date": "03-07-2019",
            "open": 8.15,
            "high": 8.19,
            "low": 7.98,
            "close": 8,
            "adjclose": 7.89
        },
        "1562247000": {
            "date": "04-07-2019",
            "open": 8.01,
            "high": 8.04,
            "low": 7.97,
            "close": 8.01,
            "adjclose": 7.9
        },
        "1562333400": {
            "date": "05-07-2019",
            "open": 7.98,
            "high": 8.14,
            "low": 7.98,
            "close": 8.11,
            "adjclose": 8
        },
        "1562592600": {
            "date": "08-07-2019",
            "open": 8.14,
            "high": 8.15,
            "low": 8.03,
            "close": 8.06,
            "adjclose": 7.95
        },
        "1562679000": {
            "date": "09-07-2019",
            "open": 8.04,
            "high": 8.09,
            "low": 7.64,
            "close": 7.67,
            "adjclose": 7.57
        },
        "1562765400": {
            "date": "10-07-2019",
            "open": 7.72,
            "high": 7.77,
            "low": 7.55,
            "close": 7.57,
            "adjclose": 7.47
        },
        "1562851800": {
            "date": "11-07-2019",
            "open": 7.64,
            "high": 7.75,
            "low": 7.57,
            "close": 7.73,
            "adjclose": 7.63
        },
        "1562938200": {
            "date": "12-07-2019",
            "open": 7.73,
            "high": 7.78,
            "low": 7.62,
            "close": 7.67,
            "adjclose": 7.57
        },
        "1563197400": {
            "date": "15-07-2019",
            "open": 7.72,
            "high": 7.74,
            "low": 7.58,
            "close": 7.67,
            "adjclose": 7.57
        },
        "1563283800": {
            "date": "16-07-2019",
            "open": 7.68,
            "high": 7.72,
            "low": 7.55,
            "close": 7.6,
            "adjclose": 7.5
        },
        "1563370200": {
            "date": "17-07-2019",
            "open": 7.62,
            "high": 7.63,
            "low": 7.39,
            "close": 7.42,
            "adjclose": 7.32
        },
        "1563456600": {
            "date": "18-07-2019",
            "open": 7.41,
            "high": 7.44,
            "low": 7.01,
            "close": 7.06,
            "adjclose": 6.96
        },
        "1563543000": {
            "date": "19-07-2019",
            "open": 7.11,
            "high": 7.15,
            "low": 7,
            "close": 7.09,
            "adjclose": 6.99
        },
        "1563802200": {
            "date": "22-07-2019",
            "open": 7.15,
            "high": 7.2,
            "low": 7,
            "close": 7.04,
            "adjclose": 6.95
        },
        "1563888600": {
            "date": "23-07-2019",
            "open": 7.05,
            "high": 7.15,
            "low": 7,
            "close": 7.05,
            "adjclose": 6.95
        },
        "1563975000": {
            "date": "24-07-2019",
            "open": 7.09,
            "high": 7.12,
            "low": 7,
            "close": 7.1,
            "adjclose": 7
        },
        "1564061400": {
            "date": "25-07-2019",
            "open": 7,
            "high": 7,
            "low": 6.83,
            "close": 6.95,
            "adjclose": 6.86
        },
        "1564147800": {
            "date": "26-07-2019",
            "open": 6.94,
            "high": 6.98,
            "low": 6.82,
            "close": 6.87,
            "adjclose": 6.78
        },
        "1564407000": {
            "date": "29-07-2019",
            "open": 6.86,
            "high": 6.95,
            "low": 6.82,
            "close": 6.89,
            "adjclose": 6.8
        },
        "1564493400": {
            "date": "30-07-2019",
            "open": 6.91,
            "high": 6.95,
            "low": 6.82,
            "close": 6.92,
            "adjclose": 6.83
        },
        "1564579800": {
            "date": "31-07-2019",
            "open": 6.91,
            "high": 6.92,
            "low": 6.68,
            "close": 6.81,
            "adjclose": 6.72
        },
        "1564666200": {
            "date": "01-08-2019",
            "open": 6.8,
            "high": 6.89,
            "low": 6.43,
            "close": 6.48,
            "adjclose": 6.39
        },
        "1564752600": {
            "date": "02-08-2019",
            "open": 6.47,
            "high": 6.51,
            "low": 6.16,
            "close": 6.26,
            "adjclose": 6.18
        },
        "1565011800": {
            "date": "05-08-2019",
            "open": 6.2,
            "high": 6.2,
            "low": 5.88,
            "close": 6.08,
            "adjclose": 6
        },
        "1565098200": {
            "date": "06-08-2019",
            "open": 6.16,
            "high": 6.33,
            "low": 5.96,
            "close": 6.04,
            "adjclose": 5.96
        },
        "1565184600": {
            "date": "07-08-2019",
            "open": 6,
            "high": 6.12,
            "low": 5.79,
            "close": 6.1,
            "adjclose": 6.02
        },
        "1565271000": {
            "date": "08-08-2019",
            "open": 6.13,
            "high": 6.19,
            "low": 6.03,
            "close": 6.14,
            "adjclose": 6.06
        },
        "1565357400": {
            "date": "09-08-2019",
            "open": 6.14,
            "high": 6.14,
            "low": 6.03,
            "close": 6.08,
            "adjclose": 6
        },
        "1565616600": {
            "date": "12-08-2019",
            "open": 6,
            "high": 6.06,
            "low": 5.86,
            "close": 5.87,
            "adjclose": 5.79
        },
        "1565703000": {
            "date": "13-08-2019",
            "open": 5.86,
            "high": 6.02,
            "low": 5.82,
            "close": 5.84,
            "adjclose": 5.76
        },
        "1565789400": {
            "date": "14-08-2019",
            "open": 5.78,
            "high": 5.9,
            "low": 5.69,
            "close": 5.82,
            "adjclose": 5.74
        },
        "1565875800": {
            "date": "15-08-2019",
            "open": 5.81,
            "high": 5.81,
            "low": 5.53,
            "close": 5.62,
            "adjclose": 5.54
        },
        "1565962200": {
            "date": "16-08-2019",
            "open": 5.62,
            "high": 5.84,
            "low": 5.62,
            "close": 5.81,
            "adjclose": 5.73
        },
        "1566221400": {
            "date": "19-08-2019",
            "open": 5.85,
            "high": 5.98,
            "low": 5.85,
            "close": 5.9,
            "adjclose": 5.82
        },
        "1566307800": {
            "date": "20-08-2019",
            "open": 5.9,
            "high": 6.08,
            "low": 5.89,
            "close": 5.98,
            "adjclose": 5.9
        },
        "1566394200": {
            "date": "21-08-2019",
            "open": 6.05,
            "high": 6.1,
            "low": 5.99,
            "close": 6.06,
            "adjclose": 5.98
        },
        "1566480600": {
            "date": "22-08-2019",
            "open": 6.1,
            "high": 6.18,
            "low": 6.04,
            "close": 6.16,
            "adjclose": 6.08
        },
        "1566567000": {
            "date": "23-08-2019",
            "open": 6.1,
            "high": 6.32,
            "low": 6.03,
            "close": 6.18,
            "adjclose": 6.1
        },
        "1566826200": {
            "date": "26-08-2019",
            "open": 6.16,
            "high": 6.28,
            "low": 6.16,
            "close": 6.21,
            "adjclose": 6.13
        },
        "1566912600": {
            "date": "27-08-2019",
            "open": 6.23,
            "high": 6.43,
            "low": 6.2,
            "close": 6.41,
            "adjclose": 6.32
        },
        "1566999000": {
            "date": "28-08-2019",
            "open": 6.4,
            "high": 6.6,
            "low": 6.38,
            "close": 6.51,
            "adjclose": 6.42
        },
        "1567085400": {
            "date": "29-08-2019",
            "open": 6.59,
            "high": 7.29,
            "low": 6.59,
            "close": 7.16,
            "adjclose": 7.06
        },
        "1567171800": {
            "date": "30-08-2019",
            "open": 7.21,
            "high": 7.69,
            "low": 7.19,
            "close": 7.47,
            "adjclose": 7.37
        },
        "1567431000": {
            "date": "02-09-2019",
            "open": 7.49,
            "high": 7.5,
            "low": 7.28,
            "close": 7.37,
            "adjclose": 7.27
        },
        "1567517400": {
            "date": "03-09-2019",
            "open": 7.39,
            "high": 7.49,
            "low": 7.05,
            "close": 7.08,
            "adjclose": 6.98
        },
        "1567603800": {
            "date": "04-09-2019",
            "open": 7.15,
            "high": 7.4,
            "low": 7.15,
            "close": 7.39,
            "adjclose": 7.29
        },
        "1567690200": {
            "date": "05-09-2019",
            "open": 7.5,
            "high": 7.67,
            "low": 7.46,
            "close": 7.65,
            "adjclose": 7.55
        },
        "1567776600": {
            "date": "06-09-2019",
            "open": 7.67,
            "high": 7.67,
            "low": 7.4,
            "close": 7.47,
            "adjclose": 7.37
        },
        "1568035800": {
            "date": "09-09-2019",
            "open": 7.54,
            "high": 7.77,
            "low": 7.45,
            "close": 7.7,
            "adjclose": 7.6
        },
        "1568122200": {
            "date": "10-09-2019",
            "open": 7.7,
            "high": 7.89,
            "low": 7.56,
            "close": 7.84,
            "adjclose": 7.73
        },
        "1568208600": {
            "date": "11-09-2019",
            "open": 7.86,
            "high": 7.86,
            "low": 7.43,
            "close": 7.57,
            "adjclose": 7.47
        },
        "1568295000": {
            "date": "12-09-2019",
            "open": 7.52,
            "high": 7.7,
            "low": 7.45,
            "close": 7.48,
            "adjclose": 7.38
        },
        "1568381400": {
            "date": "13-09-2019",
            "open": 7.52,
            "high": 7.66,
            "low": 7.48,
            "close": 7.62,
            "adjclose": 7.52
        },
        "1568727000": {
            "date": "17-09-2019",
            "open": 7.6,
            "high": 7.85,
            "low": 7.51,
            "close": 7.84,
            "adjclose": 7.73
        },
        "1568813400": {
            "date": "18-09-2019",
            "open": 7.83,
            "high": 7.84,
            "low": 7.58,
            "close": 7.74,
            "adjclose": 7.64
        },
        "1568899800": {
            "date": "19-09-2019",
            "open": 7.76,
            "high": 7.89,
            "low": 7.65,
            "close": 7.76,
            "adjclose": 7.66
        },
        "1568986200": {
            "date": "20-09-2019",
            "open": 7.79,
            "high": 8.02,
            "low": 7.74,
            "close": 7.98,
            "adjclose": 7.87
        },
        "1569245400": {
            "date": "23-09-2019",
            "open": 7.97,
            "high": 7.98,
            "low": 7.77,
            "close": 7.84,
            "adjclose": 7.73
        },
        "1569331800": {
            "date": "24-09-2019",
            "open": 7.85,
            "high": 7.86,
            "low": 7.76,
            "close": 7.79,
            "adjclose": 7.68
        },
        "1569418200": {
            "date": "25-09-2019",
            "open": 7.8,
            "high": 7.85,
            "low": 7.52,
            "close": 7.78,
            "adjclose": 7.68
        },
        "1569504600": {
            "date": "26-09-2019",
            "open": 7.8,
            "high": 7.8,
            "low": 7.7,
            "close": 7.77,
            "adjclose": 7.67
        },
        "1569591000": {
            "date": "27-09-2019",
            "open": 7.82,
            "high": 7.92,
            "low": 7.75,
            "close": 7.78,
            "adjclose": 7.68
        },
        "1569850200": {
            "date": "30-09-2019",
            "open": 7.79,
            "high": 7.88,
            "low": 7.66,
            "close": 7.69,
            "adjclose": 7.59
        },
        "1569936600": {
            "date": "01-10-2019",
            "open": 7.71,
            "high": 7.76,
            "low": 7.47,
            "close": 7.5,
            "adjclose": 7.4
        },
        "1570023000": {
            "date": "02-10-2019",
            "open": 7.45,
            "high": 7.48,
            "low": 7.12,
            "close": 7.26,
            "adjclose": 7.16
        },
        "1570109400": {
            "date": "03-10-2019",
            "open": 7.24,
            "high": 7.3,
            "low": 7.15,
            "close": 7.18,
            "adjclose": 7.08
        },
        "1570195800": {
            "date": "04-10-2019",
            "open": 7.17,
            "high": 7.32,
            "low": 7.11,
            "close": 7.3,
            "adjclose": 7.2
        },
        "1570455000": {
            "date": "07-10-2019",
            "open": 7.29,
            "high": 7.35,
            "low": 7.19,
            "close": 7.21,
            "adjclose": 7.11
        },
        "1570541400": {
            "date": "08-10-2019",
            "open": 7.16,
            "high": 7.46,
            "low": 7.15,
            "close": 7.35,
            "adjclose": 7.25
        },
        "1570627800": {
            "date": "09-10-2019",
            "open": 7.4,
            "high": 7.5,
            "low": 7.32,
            "close": 7.47,
            "adjclose": 7.37
        },
        "1570714200": {
            "date": "10-10-2019",
            "open": 7.48,
            "high": 7.7,
            "low": 7.42,
            "close": 7.56,
            "adjclose": 7.46
        },
        "1570800600": {
            "date": "11-10-2019",
            "open": 7.63,
            "high": 7.84,
            "low": 7.61,
            "close": 7.79,
            "adjclose": 7.68
        },
        "1571059800": {
            "date": "14-10-2019",
            "open": 7.74,
            "high": 7.88,
            "low": 7.66,
            "close": 7.85,
            "adjclose": 7.74
        },
        "1571146200": {
            "date": "15-10-2019",
            "open": 7.88,
            "high": 8.07,
            "low": 7.81,
            "close": 7.84,
            "adjclose": 7.73
        },
        "1571232600": {
            "date": "16-10-2019",
            "open": 7.83,
            "high": 7.96,
            "low": 7.81,
            "close": 7.86,
            "adjclose": 7.75
        },
        "1571319000": {
            "date": "17-10-2019",
            "open": 7.9,
            "high": 7.98,
            "low": 7.8,
            "close": 7.81,
            "adjclose": 7.7
        },
        "1571405400": {
            "date": "18-10-2019",
            "open": 7.72,
            "high": 7.9,
            "low": 7.62,
            "close": 7.72,
            "adjclose": 7.62
        },
        "1571664600": {
            "date": "21-10-2019",
            "open": 7.75,
            "high": 7.84,
            "low": 7.72,
            "close": 7.74,
            "adjclose": 7.64
        },
        "1571751000": {
            "date": "22-10-2019",
            "open": 7.72,
            "high": 7.89,
            "low": 7.68,
            "close": 7.87,
            "adjclose": 7.76
        },
        "1571837400": {
            "date": "23-10-2019",
            "open": 7.82,
            "high": 7.96,
            "low": 7.8,
            "close": 7.94,
            "adjclose": 7.83
        },
        "1571923800": {
            "date": "24-10-2019",
            "open": 7.85,
            "high": 7.85,
            "low": 7.33,
            "close": 7.41,
            "adjclose": 7.31
        },
        "1572010200": {
            "date": "25-10-2019",
            "open": 7.39,
            "high": 7.59,
            "low": 7.39,
            "close": 7.52,
            "adjclose": 7.42
        },
        "1572273000": {
            "date": "28-10-2019",
            "open": 7.52,
            "high": 7.8,
            "low": 7.52,
            "close": 7.79,
            "adjclose": 7.68
        },
        "1572359400": {
            "date": "29-10-2019",
            "open": 7.75,
            "high": 7.81,
            "low": 7.63,
            "close": 7.66,
            "adjclose": 7.56
        },
        "1572445800": {
            "date": "30-10-2019",
            "open": 7.72,
            "high": 7.72,
            "low": 7.31,
            "close": 7.33,
            "adjclose": 7.23
        },
        "1572532200": {
            "date": "31-10-2019",
            "open": 7.34,
            "high": 7.34,
            "low": 7.21,
            "close": 7.23,
            "adjclose": 7.13
        },
        "1572618600": {
            "date": "01-11-2019",
            "open": 7.29,
            "high": 7.38,
            "low": 7.23,
            "close": 7.32,
            "adjclose": 7.22
        },
        "1572877800": {
            "date": "04-11-2019",
            "open": 7.38,
            "high": 7.53,
            "low": 7.36,
            "close": 7.42,
            "adjclose": 7.32
        },
        "1572964200": {
            "date": "05-11-2019",
            "open": 7.45,
            "high": 7.5,
            "low": 7.36,
            "close": 7.4,
            "adjclose": 7.3
        },
        "1573050600": {
            "date": "06-11-2019",
            "open": 7.42,
            "high": 7.43,
            "low": 7.23,
            "close": 7.4,
            "adjclose": 7.3
        },
        "1573137000": {
            "date": "07-11-2019",
            "open": 7.46,
            "high": 7.5,
            "low": 7.39,
            "close": 7.42,
            "adjclose": 7.32
        },
        "1573223400": {
            "date": "08-11-2019",
            "open": 7.4,
            "high": 7.4,
            "low": 7.26,
            "close": 7.29,
            "adjclose": 7.19
        },
        "1573482600": {
            "date": "11-11-2019",
            "open": 7.25,
            "high": 7.28,
            "low": 7.17,
            "close": 7.19,
            "adjclose": 7.09
        },
        "1573569000": {
            "date": "12-11-2019",
            "open": 7.17,
            "high": 7.23,
            "low": 6.97,
            "close": 6.99,
            "adjclose": 6.9
        },
        "1573655400": {
            "date": "13-11-2019",
            "open": 6.98,
            "high": 7.1,
            "low": 6.92,
            "close": 7.06,
            "adjclose": 6.96
        },
        "1573741800": {
            "date": "14-11-2019",
            "open": 7.06,
            "high": 7.15,
            "low": 7.03,
            "close": 7.08,
            "adjclose": 6.98
        },
        "1573828200": {
            "date": "15-11-2019",
            "open": 7.1,
            "high": 7.11,
            "low": 7.03,
            "close": 7.08,
            "adjclose": 6.98
        },
        "1574173800": {
            "date": "19-11-2019",
            "open": 7.09,
            "high": 7.17,
            "low": 6.98,
            "close": 7.11,
            "adjclose": 7.01
        },
        "1574260200": {
            "date": "20-11-2019",
            "open": 7.11,
            "high": 7.19,
            "low": 7.01,
            "close": 7.02,
            "adjclose": 6.93
        },
        "1574346600": {
            "date": "21-11-2019",
            "open": 7.05,
            "high": 7.09,
            "low": 6.97,
            "close": 6.98,
            "adjclose": 6.89
        },
        "1574433000": {
            "date": "22-11-2019",
            "open": 7.01,
            "high": 7.09,
            "low": 6.97,
            "close": 7.06,
            "adjclose": 6.96
        },
        "1574692200": {
            "date": "25-11-2019",
            "open": 7.07,
            "high": 7.2,
            "low": 7.07,
            "close": 7.18,
            "adjclose": 7.08
        },
        "1574778600": {
            "date": "26-11-2019",
            "open": 7.2,
            "high": 7.33,
            "low": 7.19,
            "close": 7.21,
            "adjclose": 7.11
        },
        "1574865000": {
            "date": "27-11-2019",
            "open": 7.2,
            "high": 7.36,
            "low": 7.18,
            "close": 7.34,
            "adjclose": 7.24
        },
        "1574951400": {
            "date": "28-11-2019",
            "open": 7.32,
            "high": 7.34,
            "low": 7.22,
            "close": 7.32,
            "adjclose": 7.22
        },
        "1575037800": {
            "date": "29-11-2019",
            "open": 7.32,
            "high": 7.37,
            "low": 7.13,
            "close": 7.15,
            "adjclose": 7.05
        },
        "1575297000": {
            "date": "02-12-2019",
            "open": 7.14,
            "high": 7.31,
            "low": 7.01,
            "close": 7.07,
            "adjclose": 6.97
        },
        "1575383400": {
            "date": "03-12-2019",
            "open": 7.02,
            "high": 7.05,
            "low": 6.87,
            "close": 6.89,
            "adjclose": 6.8
        },
        "1575469800": {
            "date": "04-12-2019",
            "open": 6.92,
            "high": 6.95,
            "low": 6.8,
            "close": 6.84,
            "adjclose": 6.75
        },
        "1575556200": {
            "date": "05-12-2019",
            "open": 6.86,
            "high": 7.06,
            "low": 6.83,
            "close": 6.95,
            "adjclose": 6.86
        },
        "1575642600": {
            "date": "06-12-2019",
            "open": 6.97,
            "high": 6.98,
            "low": 6.75,
            "close": 6.76,
            "adjclose": 6.67
        },
        "1575901800": {
            "date": "09-12-2019",
            "open": 6.78,
            "high": 6.89,
            "low": 6.74,
            "close": 6.86,
            "adjclose": 6.77
        },
        "1575988200": {
            "date": "10-12-2019",
            "open": 6.9,
            "high": 6.93,
            "low": 6.8,
            "close": 6.86,
            "adjclose": 6.77
        },
        "1576074600": {
            "date": "11-12-2019",
            "open": 6.9,
            "high": 7.07,
            "low": 6.88,
            "close": 7.01,
            "adjclose": 6.92
        },
        "1576247400": {
            "date": "13-12-2019",
            "open": 6.99,
            "high": 7.18,
            "low": 6.99,
            "close": 7.14,
            "adjclose": 7.14
        },
        "1576506600": {
            "date": "16-12-2019",
            "open": 7.19,
            "high": 7.23,
            "low": 7.15,
            "close": 7.17,
            "adjclose": 7.17
        },
        "1576593000": {
            "date": "17-12-2019",
            "open": 7.2,
            "high": 7.2,
            "low": 7.06,
            "close": 7.13,
            "adjclose": 7.13
        },
        "1576679400": {
            "date": "18-12-2019",
            "open": 7.13,
            "high": 7.37,
            "low": 7.08,
            "close": 7.35,
            "adjclose": 7.35
        },
        "1576765800": {
            "date": "19-12-2019",
            "open": 7.38,
            "high": 7.45,
            "low": 7.28,
            "close": 7.31,
            "adjclose": 7.31
        },
        "1576852200": {
            "date": "20-12-2019",
            "open": 7.33,
            "high": 7.36,
            "low": 7.2,
            "close": 7.23,
            "adjclose": 7.23
        },
        "1577111400": {
            "date": "23-12-2019",
            "open": 7.23,
            "high": 7.3,
            "low": 7.2,
            "close": 7.25,
            "adjclose": 7.25
        },
        "1577197800": {
            "date": "24-12-2019",
            "open": 7.22,
            "high": 7.28,
            "low": 7.2,
            "close": 7.23,
            "adjclose": 7.23
        },
        "1577370600": {
            "date": "26-12-2019",
            "open": 7.21,
            "high": 7.35,
            "low": 7.2,
            "close": 7.33,
            "adjclose": 7.33
        },
        "1577457000": {
            "date": "27-12-2019",
            "open": 7.33,
            "high": 7.36,
            "low": 7.19,
            "close": 7.23,
            "adjclose": 7.23
        },
        "1577716200": {
            "date": "30-12-2019",
            "open": 7.27,
            "high": 7.28,
            "low": 7.04,
            "close": 7.16,
            "adjclose": 7.16
        },
        "1577802600": {
            "date": "31-12-2019",
            "open": 7.16,
            "high": 7.16,
            "low": 7.16,
            "close": 7.16,
            "adjclose": 7.16
        },
        "1577975400": {
            "date": "02-01-2020",
            "open": 7.17,
            "high": 7.28,
            "low": 7.12,
            "close": 7.16,
            "adjclose": 7.16
        },
        "1578061800": {
            "date": "03-01-2020",
            "open": 7.13,
            "high": 7.23,
            "low": 7.13,
            "close": 7.19,
            "adjclose": 7.19
        },
        "1578321000": {
            "date": "06-01-2020",
            "open": 7.15,
            "high": 7.22,
            "low": 7.07,
            "close": 7.2,
            "adjclose": 7.2
        },
        "1578407400": {
            "date": "07-01-2020",
            "open": 7.16,
            "high": 7.2,
            "low": 7.01,
            "close": 7.07,
            "adjclose": 7.07
        },
        "1578493800": {
            "date": "08-01-2020",
            "open": 7.1,
            "high": 7.22,
            "low": 7.05,
            "close": 7.2,
            "adjclose": 7.2
        },
        "1578580200": {
            "date": "09-01-2020",
            "open": 7.21,
            "high": 7.26,
            "low": 7.06,
            "close": 7.1,
            "adjclose": 7.1
        },
        "1578666600": {
            "date": "10-01-2020",
            "open": 7.1,
            "high": 7.22,
            "low": 7.08,
            "close": 7.18,
            "adjclose": 7.18
        },
        "1578925800": {
            "date": "13-01-2020",
            "open": 7.19,
            "high": 7.21,
            "low": 7.11,
            "close": 7.15,
            "adjclose": 7.15
        },
        "1579012200": {
            "date": "14-01-2020",
            "open": 7.14,
            "high": 7.17,
            "low": 7.09,
            "close": 7.12,
            "adjclose": 7.12
        },
        "1579098600": {
            "date": "15-01-2020",
            "open": 7.1,
            "high": 7.15,
            "low": 6.93,
            "close": 6.95,
            "adjclose": 6.95
        },
        "1579185000": {
            "date": "16-01-2020",
            "open": 6.99,
            "high": 7.34,
            "low": 6.92,
            "close": 7.29,
            "adjclose": 7.29
        },
        "1579271400": {
            "date": "17-01-2020",
            "open": 7.31,
            "high": 7.88,
            "low": 7.31,
            "close": 7.82,
            "adjclose": 7.82
        },
        "1579530600": {
            "date": "20-01-2020",
            "open": 7.81,
            "high": 7.81,
            "low": 7.67,
            "close": 7.7,
            "adjclose": 7.7
        },
        "1579617000": {
            "date": "21-01-2020",
            "open": 7.62,
            "high": 7.82,
            "low": 7.59,
            "close": 7.71,
            "adjclose": 7.71
        },
        "1579703400": {
            "date": "22-01-2020",
            "open": 7.7,
            "high": 8.03,
            "low": 7.7,
            "close": 7.89,
            "adjclose": 7.89
        },
        "1579789800": {
            "date": "23-01-2020",
            "open": 7.85,
            "high": 7.89,
            "low": 7.64,
            "close": 7.88,
            "adjclose": 7.88
        },
        "1579876200": {
            "date": "24-01-2020",
            "open": 7.89,
            "high": 7.96,
            "low": 7.82,
            "close": 7.87,
            "adjclose": 7.87
        },
        "1580135400": {
            "date": "27-01-2020",
            "open": 7.76,
            "high": 7.86,
            "low": 7.61,
            "close": 7.78,
            "adjclose": 7.78
        },
        "1580221800": {
            "date": "28-01-2020",
            "open": 7.81,
            "high": 8.12,
            "low": 7.77,
            "close": 8.05,
            "adjclose": 8.05
        },
        "1580308200": {
            "date": "29-01-2020",
            "open": 8.1,
            "high": 8.1,
            "low": 7.83,
            "close": 7.95,
            "adjclose": 7.95
        },
        "1580394600": {
            "date": "30-01-2020",
            "open": 7.94,
            "high": 7.94,
            "low": 7.72,
            "close": 7.85,
            "adjclose": 7.85
        },
        "1580481000": {
            "date": "31-01-2020",
            "open": 7.82,
            "high": 7.85,
            "low": 7.57,
            "close": 7.59,
            "adjclose": 7.59
        },
        "1580826600": {
            "date": "04-02-2020",
            "open": 7.73,
            "high": 7.99,
            "low": 7.73,
            "close": 7.95,
            "adjclose": 7.95
        },
        "1580913000": {
            "date": "05-02-2020",
            "open": 7.98,
            "high": 8,
            "low": 7.73,
            "close": 7.75,
            "adjclose": 7.75
        },
        "1580999400": {
            "date": "06-02-2020",
            "open": 7.75,
            "high": 7.84,
            "low": 7.67,
            "close": 7.75,
            "adjclose": 7.75
        },
        "1581085800": {
            "date": "07-02-2020",
            "open": 7.72,
            "high": 7.85,
            "low": 7.68,
            "close": 7.79,
            "adjclose": 7.79
        },
        "1581345000": {
            "date": "10-02-2020",
            "open": 7.8,
            "high": 7.8,
            "low": 7.68,
            "close": 7.74,
            "adjclose": 7.74
        },
        "1581431400": {
            "date": "11-02-2020",
            "open": 7.78,
            "high": 8.05,
            "low": 7.68,
            "close": 8.05,
            "adjclose": 8.05
        },
        "1581517800": {
            "date": "12-02-2020",
            "open": 7.77,
            "high": 7.8,
            "low": 7.53,
            "close": 7.65,
            "adjclose": 7.65
        },
        "1581604200": {
            "date": "13-02-2020",
            "open": 7.62,
            "high": 7.66,
            "low": 7.2,
            "close": 7.28,
            "adjclose": 7.28
        },
        "1581690600": {
            "date": "14-02-2020",
            "open": 7.31,
            "high": 7.4,
            "low": 7.1,
            "close": 7.15,
            "adjclose": 7.15
        },
        "1581949800": {
            "date": "17-02-2020",
            "open": 7.19,
            "high": 7.26,
            "low": 7.12,
            "close": 7.16,
            "adjclose": 7.16
        },
        "1582036200": {
            "date": "18-02-2020",
            "open": 7.15,
            "high": 7.23,
            "low": 6.97,
            "close": 7,
            "adjclose": 7
        },
        "1582122600": {
            "date": "19-02-2020",
            "open": 7.05,
            "high": 7.07,
            "low": 6.82,
            "close": 6.95,
            "adjclose": 6.95
        },
        "1582209000": {
            "date": "20-02-2020",
            "open": 6.99,
            "high": 7.11,
            "low": 6.93,
            "close": 7,
            "adjclose": 7
        },
        "1582295400": {
            "date": "21-02-2020",
            "open": 6.98,
            "high": 7.15,
            "low": 6.98,
            "close": 7.1,
            "adjclose": 7.1
        },
        "1582554600": {
            "date": "24-02-2020",
            "open": 6.91,
            "high": 7.21,
            "low": 6.9,
            "close": 7.05,
            "adjclose": 7.05
        },
        "1582641000": {
            "date": "25-02-2020",
            "open": 7.09,
            "high": 7.09,
            "low": 6.87,
            "close": 6.9,
            "adjclose": 6.9
        },
        "1582727400": {
            "date": "26-02-2020",
            "open": 6.94,
            "high": 6.99,
            "low": 6.39,
            "close": 6.44,
            "adjclose": 6.44
        },
        "1582813800": {
            "date": "27-02-2020",
            "open": 6.35,
            "high": 6.55,
            "low": 6.08,
            "close": 6.17,
            "adjclose": 6.17
        },
        "1582900200": {
            "date": "28-02-2020",
            "open": 6.09,
            "high": 6.46,
            "low": 5.91,
            "close": 6.34,
            "adjclose": 6.34
        },
        "1583159400": {
            "date": "02-03-2020",
            "open": 6.34,
            "high": 6.64,
            "low": 6.32,
            "close": 6.41,
            "adjclose": 6.41
        },
        "1583245800": {
            "date": "03-03-2020",
            "open": 6.44,
            "high": 6.87,
            "low": 6.38,
            "close": 6.59,
            "adjclose": 6.59
        },
        "1583332200": {
            "date": "04-03-2020",
            "open": 6.7,
            "high": 6.75,
            "low": 6.51,
            "close": 6.73,
            "adjclose": 6.73
        },
        "1583418600": {
            "date": "05-03-2020",
            "open": 6.66,
            "high": 6.66,
            "low": 6.18,
            "close": 6.26,
            "adjclose": 6.26
        },
        "1583505000": {
            "date": "06-03-2020",
            "open": 6.2,
            "high": 6.2,
            "low": 5.82,
            "close": 5.88,
            "adjclose": 5.88
        },
        "1583764200": {
            "date": "09-03-2020",
            "open": 5.67,
            "high": 5.67,
            "low": 5.3,
            "close": 5.39,
            "adjclose": 5.39
        },
        "1583850600": {
            "date": "10-03-2020",
            "open": 5.6,
            "high": 5.75,
            "low": 5.45,
            "close": 5.67,
            "adjclose": 5.67
        },
        "1583937000": {
            "date": "11-03-2020",
            "open": 5.65,
            "high": 5.75,
            "low": 5.54,
            "close": 5.65,
            "adjclose": 5.65
        },
        "1584023400": {
            "date": "12-03-2020",
            "open": 5.5,
            "high": 5.5,
            "low": 5.01,
            "close": 5.23,
            "adjclose": 5.23
        },
        "1584109800": {
            "date": "13-03-2020",
            "open": 5.45,
            "high": 5.53,
            "low": 5.21,
            "close": 5.37,
            "adjclose": 5.37
        },
        "1584455400": {
            "date": "17-03-2020",
            "open": 5,
            "high": 5.51,
            "low": 4.19,
            "close": 5.07,
            "adjclose": 5.07
        },
        "1584541800": {
            "date": "18-03-2020",
            "open": 4.86,
            "high": 5.27,
            "low": 4.62,
            "close": 4.74,
            "adjclose": 4.74
        },
        "1584628200": {
            "date": "19-03-2020",
            "open": 4.8,
            "high": 5,
            "low": 4.51,
            "close": 4.57,
            "adjclose": 4.57
        },
        "1584714600": {
            "date": "20-03-2020",
            "open": 4.69,
            "high": 4.75,
            "low": 4.22,
            "close": 4.32,
            "adjclose": 4.32
        },
        "1584973800": {
            "date": "23-03-2020",
            "open": 4.46,
            "high": 4.5,
            "low": 3.98,
            "close": 4.24,
            "adjclose": 4.24
        },
        "1585060200": {
            "date": "24-03-2020",
            "open": 4.44,
            "high": 4.66,
            "low": 4.29,
            "close": 4.47,
            "adjclose": 4.47
        },
        "1585146600": {
            "date": "25-03-2020",
            "open": 4.52,
            "high": 4.74,
            "low": 4.2,
            "close": 4.29,
            "adjclose": 4.29
        },
        "1585233000": {
            "date": "26-03-2020",
            "open": 4.24,
            "high": 4.7,
            "low": 4.24,
            "close": 4.61,
            "adjclose": 4.61
        },
        "1585319400": {
            "date": "27-03-2020",
            "open": 4.45,
            "high": 4.52,
            "low": 4.26,
            "close": 4.29,
            "adjclose": 4.29
        },
        "1585578600": {
            "date": "30-03-2020",
            "open": 4.36,
            "high": 4.45,
            "low": 4.26,
            "close": 4.34,
            "adjclose": 4.34
        },
        "1585665000": {
            "date": "31-03-2020",
            "open": 4.3,
            "high": 5.01,
            "low": 4.24,
            "close": 4.93,
            "adjclose": 4.93
        },
        "1585751400": {
            "date": "01-04-2020",
            "open": 4.81,
            "high": 5.04,
            "low": 4.56,
            "close": 4.59,
            "adjclose": 4.59
        },
        "1585837800": {
            "date": "02-04-2020",
            "open": 4.64,
            "high": 4.7,
            "low": 4.37,
            "close": 4.46,
            "adjclose": 4.46
        },
        "1585924200": {
            "date": "03-04-2020",
            "open": 4.5,
            "high": 4.6,
            "low": 4.05,
            "close": 4.21,
            "adjclose": 4.21
        },
        "1586179800": {
            "date": "06-04-2020",
            "open": 4.38,
            "high": 4.7,
            "low": 4.38,
            "close": 4.61,
            "adjclose": 4.61
        },
        "1586266200": {
            "date": "07-04-2020",
            "open": 4.75,
            "high": 5.19,
            "low": 4.75,
            "close": 4.93,
            "adjclose": 4.93
        },
        "1586352600": {
            "date": "08-04-2020",
            "open": 4.99,
            "high": 5.06,
            "low": 4.79,
            "close": 5.01,
            "adjclose": 5.01
        },
        "1586784600": {
            "date": "13-04-2020",
            "open": 5.14,
            "high": 5.69,
            "low": 5.03,
            "close": 5.09,
            "adjclose": 5.09
        },
        "1586871000": {
            "date": "14-04-2020",
            "open": 5.14,
            "high": 5.19,
            "low": 4.8,
            "close": 4.85,
            "adjclose": 4.85
        },
        "1586957400": {
            "date": "15-04-2020",
            "open": 4.78,
            "high": 4.91,
            "low": 4.62,
            "close": 4.84,
            "adjclose": 4.84
        },
        "1587043800": {
            "date": "16-04-2020",
            "open": 4.88,
            "high": 4.98,
            "low": 4.63,
            "close": 4.72,
            "adjclose": 4.72
        },
        "1587130200": {
            "date": "17-04-2020",
            "open": 4.84,
            "high": 5.13,
            "low": 4.72,
            "close": 5.05,
            "adjclose": 5.05
        },
        "1587389400": {
            "date": "20-04-2020",
            "open": 4.99,
            "high": 5.11,
            "low": 4.91,
            "close": 4.97,
            "adjclose": 4.97
        },
        "1587475800": {
            "date": "21-04-2020",
            "open": 4.94,
            "high": 4.98,
            "low": 4.65,
            "close": 4.68,
            "adjclose": 4.68
        },
        "1587562200": {
            "date": "22-04-2020",
            "open": 4.78,
            "high": 5.04,
            "low": 4.63,
            "close": 4.69,
            "adjclose": 4.69
        },
        "1587648600": {
            "date": "23-04-2020",
            "open": 4.72,
            "high": 4.82,
            "low": 4.61,
            "close": 4.67,
            "adjclose": 4.67
        },
        "1587735000": {
            "date": "24-04-2020",
            "open": 4.74,
            "high": 4.8,
            "low": 4.54,
            "close": 4.63,
            "adjclose": 4.63
        },
        "1587994200": {
            "date": "27-04-2020",
            "open": 4.69,
            "high": 4.72,
            "low": 4.5,
            "close": 4.68,
            "adjclose": 4.68
        },
        "1588080600": {
            "date": "28-04-2020",
            "open": 4.72,
            "high": 5.46,
            "low": 4.72,
            "close": 5.05,
            "adjclose": 5.05
        },
        "1588167000": {
            "date": "29-04-2020",
            "open": 5.12,
            "high": 5.33,
            "low": 5.06,
            "close": 5.22,
            "adjclose": 5.22
        },
        "1588253400": {
            "date": "30-04-2020",
            "open": 5.26,
            "high": 5.3,
            "low": 4.93,
            "close": 5.07,
            "adjclose": 5.07
        },
        "1588599000": {
            "date": "04-05-2020",
            "open": 4.95,
            "high": 5.17,
            "low": 4.76,
            "close": 5.13,
            "adjclose": 5.13
        },
        "1588685400": {
            "date": "05-05-2020",
            "open": 5.11,
            "high": 5.35,
            "low": 5.06,
            "close": 5.18,
            "adjclose": 5.18
        },
        "1588771800": {
            "date": "06-05-2020",
            "open": 5.2,
            "high": 5.24,
            "low": 4.98,
            "close": 5.02,
            "adjclose": 5.02
        },
        "1588858200": {
            "date": "07-05-2020",
            "open": 5.09,
            "high": 5.15,
            "low": 5.02,
            "close": 5.08,
            "adjclose": 5.08
        },
        "1588944600": {
            "date": "08-05-2020",
            "open": 5.1,
            "high": 5.19,
            "low": 5.08,
            "close": 5.12,
            "adjclose": 5.12
        },
        "1589203800": {
            "date": "11-05-2020",
            "open": 5.13,
            "high": 5.19,
            "low": 5.06,
            "close": 5.13,
            "adjclose": 5.13
        },
        "1589290200": {
            "date": "12-05-2020",
            "open": 5.11,
            "high": 5.22,
            "low": 5.02,
            "close": 5.05,
            "adjclose": 5.05
        },
        "1589376600": {
            "date": "13-05-2020",
            "open": 5.08,
            "high": 5.08,
            "low": 4.59,
            "close": 4.64,
            "adjclose": 4.64
        },
        "1589463000": {
            "date": "14-05-2020",
            "open": 4.57,
            "high": 4.7,
            "low": 4.43,
            "close": 4.57,
            "adjclose": 4.57
        },
        "1589549400": {
            "date": "15-05-2020",
            "open": 4.55,
            "high": 4.67,
            "low": 4.45,
            "close": 4.62,
            "adjclose": 4.62
        },
        "1589808600": {
            "date": "18-05-2020",
            "open": 4.72,
            "high": 4.81,
            "low": 4.63,
            "close": 4.72,
            "adjclose": 4.72
        },
        "1589895000": {
            "date": "19-05-2020",
            "open": 4.69,
            "high": 4.79,
            "low": 4.61,
            "close": 4.65,
            "adjclose": 4.65
        },
        "1589981400": {
            "date": "20-05-2020",
            "open": 4.71,
            "high": 4.87,
            "low": 4.63,
            "close": 4.83,
            "adjclose": 4.83
        },
        "1590067800": {
            "date": "21-05-2020",
            "open": 4.8,
            "high": 4.95,
            "low": 4.74,
            "close": 4.87,
            "adjclose": 4.87
        },
        "1590154200": {
            "date": "22-05-2020",
            "open": 4.87,
            "high": 4.89,
            "low": 4.72,
            "close": 4.77,
            "adjclose": 4.77
        },
        "1590413400": {
            "date": "25-05-2020",
            "open": 4.78,
            "high": 4.82,
            "low": 4.73,
            "close": 4.77,
            "adjclose": 4.77
        },
        "1590499800": {
            "date": "26-05-2020",
            "open": 4.83,
            "high": 5,
            "low": 4.77,
            "close": 4.94,
            "adjclose": 4.94
        },
        "1590586200": {
            "date": "27-05-2020",
            "open": 4.99,
            "high": 5.33,
            "low": 4.96,
            "close": 5.3,
            "adjclose": 5.3
        },
        "1590672600": {
            "date": "28-05-2020",
            "open": 5.35,
            "high": 5.4,
            "low": 5.11,
            "close": 5.29,
            "adjclose": 5.29
        },
        "1590759000": {
            "date": "29-05-2020",
            "open": 5.29,
            "high": 5.29,
            "low": 5.15,
            "close": 5.25,
            "adjclose": 5.25
        },
        "1591018200": {
            "date": "01-06-2020",
            "open": 5.24,
            "high": 5.36,
            "low": 5.16,
            "close": 5.33,
            "adjclose": 5.33
        },
        "1591104600": {
            "date": "02-06-2020",
            "open": 5.39,
            "high": 5.87,
            "low": 5.36,
            "close": 5.82,
            "adjclose": 5.82
        },
        "1591191000": {
            "date": "03-06-2020",
            "open": 5.85,
            "high": 6.33,
            "low": 5.85,
            "close": 6.3,
            "adjclose": 6.3
        },
        "1591277400": {
            "date": "04-06-2020",
            "open": 6.31,
            "high": 6.38,
            "low": 6.08,
            "close": 6.18,
            "adjclose": 6.18
        },
        "1591363800": {
            "date": "05-06-2020",
            "open": 6.39,
            "high": 6.62,
            "low": 6.25,
            "close": 6.46,
            "adjclose": 6.46
        },
        "1591623000": {
            "date": "08-06-2020",
            "open": 6.54,
            "high": 6.73,
            "low": 6.43,
            "close": 6.68,
            "adjclose": 6.68
        },
        "1591709400": {
            "date": "09-06-2020",
            "open": 6.6,
            "high": 6.7,
            "low": 6.27,
            "close": 6.4,
            "adjclose": 6.4
        },
        "1591795800": {
            "date": "10-06-2020",
            "open": 6.38,
            "high": 6.38,
            "low": 5.94,
            "close": 5.98,
            "adjclose": 5.98
        },
        "1591882200": {
            "date": "11-06-2020",
            "open": 5.87,
            "high": 5.89,
            "low": 5.39,
            "close": 5.85,
            "adjclose": 5.85
        },
        "1591968600": {
            "date": "12-06-2020",
            "open": 6.03,
            "high": 6.26,
            "low": 6.02,
            "close": 6.19,
            "adjclose": 6.19
        },
        "1592227800": {
            "date": "15-06-2020",
            "open": 6.13,
            "high": 6.16,
            "low": 5.91,
            "close": 5.93,
            "adjclose": 5.93
        },
        "1592314200": {
            "date": "16-06-2020",
            "open": 6.16,
            "high": 6.7,
            "low": 6.15,
            "close": 6.24,
            "adjclose": 6.24
        },
        "1592400600": {
            "date": "17-06-2020",
            "open": 6.27,
            "high": 6.35,
            "low": 6.12,
            "close": 6.26,
            "adjclose": 6.26
        },
        "1592487000": {
            "date": "18-06-2020",
            "open": 6.25,
            "high": 6.65,
            "low": 6.13,
            "close": 6.6,
            "adjclose": 6.6
        },
        "1592573400": {
            "date": "19-06-2020",
            "open": 6.66,
            "high": 6.83,
            "low": 6.18,
            "close": 6.35,
            "adjclose": 6.35
        },
        "1592832600": {
            "date": "22-06-2020",
            "open": 6.37,
            "high": 6.5,
            "low": 6.25,
            "close": 6.47,
            "adjclose": 6.47
        },
        "1592919000": {
            "date": "23-06-2020",
            "open": 6.57,
            "high": 6.58,
            "low": 6.35,
            "close": 6.37,
            "adjclose": 6.37
        },
        "1593005400": {
            "date": "24-06-2020",
            "open": 6.3,
            "high": 6.39,
            "low": 6.18,
            "close": 6.26,
            "adjclose": 6.26
        },
        "1593091800": {
            "date": "25-06-2020",
            "open": 6.24,
            "high": 6.43,
            "low": 6.11,
            "close": 6.37,
            "adjclose": 6.37
        },
        "1593178200": {
            "date": "26-06-2020",
            "open": 6.37,
            "high": 6.4,
            "low": 6.25,
            "close": 6.28,
            "adjclose": 6.28
        },
        "1593437400": {
            "date": "29-06-2020",
            "open": 6.36,
            "high": 6.49,
            "low": 6.26,
            "close": 6.45,
            "adjclose": 6.45
        },
        "1593523800": {
            "date": "30-06-2020",
            "open": 6.44,
            "high": 6.5,
            "low": 6.34,
            "close": 6.48,
            "adjclose": 6.48
        },
        "1593610200": {
            "date": "01-07-2020",
            "open": 6.47,
            "high": 6.59,
            "low": 6.1,
            "close": 6.24,
            "adjclose": 6.24
        },
        "1593696600": {
            "date": "02-07-2020",
            "open": 6.33,
            "high": 6.45,
            "low": 6.3,
            "close": 6.38,
            "adjclose": 6.38
        },
        "1593783000": {
            "date": "03-07-2020",
            "open": 6.41,
            "high": 6.44,
            "low": 6.37,
            "close": 6.43,
            "adjclose": 6.43
        },
        "1594042200": {
            "date": "06-07-2020",
            "open": 6.46,
            "high": 6.48,
            "low": 6.33,
            "close": 6.43,
            "adjclose": 6.43
        },
        "1594128600": {
            "date": "07-07-2020",
            "open": 6.42,
            "high": 6.44,
            "low": 6.33,
            "close": 6.37,
            "adjclose": 6.37
        },
        "1594215000": {
            "date": "08-07-2020",
            "open": 6.43,
            "high": 6.43,
            "low": 6.2,
            "close": 6.29,
            "adjclose": 6.29
        },
        "1594301400": {
            "date": "09-07-2020",
            "open": 6.28,
            "high": 6.29,
            "low": 5.97,
            "close": 5.99,
            "adjclose": 5.99
        },
        "1594387800": {
            "date": "10-07-2020",
            "open": 6,
            "high": 6.06,
            "low": 5.85,
            "close": 5.96,
            "adjclose": 5.96
        },
        "1594647000": {
            "date": "13-07-2020",
            "open": 6,
            "high": 6.24,
            "low": 5.94,
            "close": 6.19,
            "adjclose": 6.19
        },
        "1594733400": {
            "date": "14-07-2020",
            "open": 6.22,
            "high": 6.23,
            "low": 6.03,
            "close": 6.13,
            "adjclose": 6.13
        },
        "1594819800": {
            "date": "15-07-2020",
            "open": 6.21,
            "high": 6.49,
            "low": 6.21,
            "close": 6.36,
            "adjclose": 6.36
        },
        "1594906200": {
            "date": "16-07-2020",
            "open": 6.35,
            "high": 6.48,
            "low": 6.3,
            "close": 6.44,
            "adjclose": 6.44
        },
        "1594992600": {
            "date": "17-07-2020",
            "open": 6.45,
            "high": 6.49,
            "low": 6.34,
            "close": 6.37,
            "adjclose": 6.37
        },
        "1595251800": {
            "date": "20-07-2020",
            "open": 6.34,
            "high": 6.43,
            "low": 6.29,
            "close": 6.3,
            "adjclose": 6.3
        },
        "1595338200": {
            "date": "21-07-2020",
            "open": 6.31,
            "high": 6.39,
            "low": 6.22,
            "close": 6.27,
            "adjclose": 6.27
        },
        "1595424600": {
            "date": "22-07-2020",
            "open": 6.26,
            "high": 6.36,
            "low": 6.25,
            "close": 6.29,
            "adjclose": 6.29
        },
        "1595511000": {
            "date": "23-07-2020",
            "open": 6.35,
            "high": 6.35,
            "low": 6.17,
            "close": 6.28,
            "adjclose": 6.28
        },
        "1595597400": {
            "date": "24-07-2020",
            "open": 6.3,
            "high": 6.3,
            "low": 6.14,
            "close": 6.24,
            "adjclose": 6.24
        },
        "1595856600": {
            "date": "27-07-2020",
            "open": 6.51,
            "high": 6.88,
            "low": 6.39,
            "close": 6.8,
            "adjclose": 6.8
        },
        "1595943000": {
            "date": "28-07-2020",
            "open": 6.8,
            "high": 6.95,
            "low": 6.69,
            "close": 6.78,
            "adjclose": 6.78
        },
        "1596029400": {
            "date": "29-07-2020",
            "open": 6.8,
            "high": 6.93,
            "low": 6.68,
            "close": 6.89,
            "adjclose": 6.89
        },
        "1596115800": {
            "date": "30-07-2020",
            "open": 6.83,
            "high": 6.86,
            "low": 6.71,
            "close": 6.77,
            "adjclose": 6.77
        },
        "1596202200": {
            "date": "31-07-2020",
            "open": 6.81,
            "high": 6.85,
            "low": 6.6,
            "close": 6.82,
            "adjclose": 6.82
        },
        "1596461400": {
            "date": "03-08-2020",
            "open": 6.93,
            "high": 7.11,
            "low": 6.85,
            "close": 7.03,
            "adjclose": 7.03
        },
        "1596547800": {
            "date": "04-08-2020",
            "open": 7.1,
            "high": 7.24,
            "low": 7.04,
            "close": 7.15,
            "adjclose": 7.15
        },
        "1596634200": {
            "date": "05-08-2020",
            "open": 7.17,
            "high": 7.36,
            "low": 7.16,
            "close": 7.28,
            "adjclose": 7.28
        },
        "1596720600": {
            "date": "06-08-2020",
            "open": 7.31,
            "high": 7.41,
            "low": 7.21,
            "close": 7.3,
            "adjclose": 7.3
        },
        "1596807000": {
            "date": "07-08-2020",
            "open": 7.33,
            "high": 7.38,
            "low": 7.21,
            "close": 7.32,
            "adjclose": 7.32
        },
        "1597066200": {
            "date": "10-08-2020",
            "open": 7.35,
            "high": 7.57,
            "low": 7.35,
            "close": 7.47,
            "adjclose": 7.47
        },
        "1597152600": {
            "date": "11-08-2020",
            "open": 7.57,
            "high": 7.62,
            "low": 7.44,
            "close": 7.51,
            "adjclose": 7.51
        },
        "1597239000": {
            "date": "12-08-2020",
            "open": 7.58,
            "high": 7.58,
            "low": 7.34,
            "close": 7.39,
            "adjclose": 7.39
        },
        "1597325400": {
            "date": "13-08-2020",
            "open": 7.4,
            "high": 7.49,
            "low": 7.38,
            "close": 7.4,
            "adjclose": 7.4
        },
        "1597411800": {
            "date": "14-08-2020",
            "open": 7.37,
            "high": 7.54,
            "low": 7.36,
            "close": 7.5,
            "adjclose": 7.5
        },
        "1597671000": {
            "date": "17-08-2020",
            "open": 7.53,
            "high": 7.85,
            "low": 7.48,
            "close": 7.81,
            "adjclose": 7.81
        },
        "1597757400": {
            "date": "18-08-2020",
            "open": 7.8,
            "high": 7.8,
            "low": 7.5,
            "close": 7.62,
            "adjclose": 7.62
        },
        "1597843800": {
            "date": "19-08-2020",
            "open": 7.65,
            "high": 7.65,
            "low": 7.44,
            "close": 7.48,
            "adjclose": 7.48
        },
        "1597930200": {
            "date": "20-08-2020",
            "open": 7.48,
            "high": 7.74,
            "low": 7.44,
            "close": 7.67,
            "adjclose": 7.67
        },
        "1598016600": {
            "date": "21-08-2020",
            "open": 7.66,
            "high": 7.66,
            "low": 7.51,
            "close": 7.57,
            "adjclose": 7.57
        },
        "1598275800": {
            "date": "24-08-2020",
            "open": 7.6,
            "high": 7.71,
            "low": 7.54,
            "close": 7.66,
            "adjclose": 7.66
        },
        "1598362200": {
            "date": "25-08-2020",
            "open": 7.7,
            "high": 7.76,
            "low": 7.55,
            "close": 7.72,
            "adjclose": 7.72
        },
        "1598448600": {
            "date": "26-08-2020",
            "open": 7.73,
            "high": 7.73,
            "low": 7.61,
            "close": 7.66,
            "adjclose": 7.66
        },
        "1598535000": {
            "date": "27-08-2020",
            "open": 7.64,
            "high": 7.68,
            "low": 7.47,
            "close": 7.56,
            "adjclose": 7.56
        },
        "1598621400": {
            "date": "28-08-2020",
            "open": 7.56,
            "high": 7.63,
            "low": 7.33,
            "close": 7.38,
            "adjclose": 7.38
        },
        "1598880600": {
            "date": "31-08-2020",
            "open": 7.4,
            "high": 7.4,
            "low": 7.01,
            "close": 7.02,
            "adjclose": 7.02
        },
        "1598967000": {
            "date": "01-09-2020",
            "open": 7.03,
            "high": 7.23,
            "low": 7,
            "close": 7.2,
            "adjclose": 7.2
        },
        "1599053400": {
            "date": "02-09-2020",
            "open": 7.24,
            "high": 7.24,
            "low": 7.01,
            "close": 7.09,
            "adjclose": 7.09
        },
        "1599139800": {
            "date": "03-09-2020",
            "open": 7.13,
            "high": 7.13,
            "low": 6.76,
            "close": 6.86,
            "adjclose": 6.86
        },
        "1599226200": {
            "date": "04-09-2020",
            "open": 6.84,
            "high": 6.94,
            "low": 6.71,
            "close": 6.87,
            "adjclose": 6.87
        },
        "1599485400": {
            "date": "07-09-2020",
            "open": 6.9,
            "high": 6.95,
            "low": 6.83,
            "close": 6.93,
            "adjclose": 6.93
        },
        "1599571800": {
            "date": "08-09-2020",
            "open": 6.93,
            "high": 6.93,
            "low": 6.71,
            "close": 6.81,
            "adjclose": 6.81
        },
        "1599658200": {
            "date": "09-09-2020",
            "open": 6.82,
            "high": 6.98,
            "low": 6.76,
            "close": 6.92,
            "adjclose": 6.92
        },
        "1599744600": {
            "date": "10-09-2020",
            "open": 6.9,
            "high": 7.6,
            "low": 6.85,
            "close": 7.52,
            "adjclose": 7.52
        },
        "1599831000": {
            "date": "11-09-2020",
            "open": 7.52,
            "high": 8.24,
            "low": 7.52,
            "close": 8.04,
            "adjclose": 8.04
        },
        "1600090200": {
            "date": "14-09-2020",
            "open": 8.15,
            "high": 8.34,
            "low": 8.04,
            "close": 8.3,
            "adjclose": 8.3
        },
        "1600176600": {
            "date": "15-09-2020",
            "open": 8.3,
            "high": 8.75,
            "low": 8.3,
            "close": 8.43,
            "adjclose": 8.43
        },
        "1600349400": {
            "date": "17-09-2020",
            "open": 8.48,
            "high": 8.48,
            "low": 8.11,
            "close": 8.14,
            "adjclose": 8.14
        },
        "1600435800": {
            "date": "18-09-2020",
            "open": 8.12,
            "high": 8.27,
            "low": 8.02,
            "close": 8.15,
            "adjclose": 8.15
        },
        "1600695000": {
            "date": "21-09-2020",
            "open": 8.12,
            "high": 8.12,
            "low": 7.78,
            "close": 7.82,
            "adjclose": 7.82
        },
        "1600781400": {
            "date": "22-09-2020",
            "open": 7.83,
            "high": 8.02,
            "low": 7.82,
            "close": 7.99,
            "adjclose": 7.99
        },
        "1600867800": {
            "date": "23-09-2020",
            "open": 8.01,
            "high": 8.13,
            "low": 7.89,
            "close": 7.98,
            "adjclose": 7.98
        },
        "1600954200": {
            "date": "24-09-2020",
            "open": 7.94,
            "high": 8.02,
            "low": 7.84,
            "close": 7.88,
            "adjclose": 7.88
        },
        "1601040600": {
            "date": "25-09-2020",
            "open": 7.88,
            "high": 8.03,
            "low": 7.8,
            "close": 7.99,
            "adjclose": 7.99
        },
        "1601299800": {
            "date": "28-09-2020",
            "open": 8.05,
            "high": 8.38,
            "low": 8.02,
            "close": 8.3,
            "adjclose": 8.3
        },
        "1601386200": {
            "date": "29-09-2020",
            "open": 8.3,
            "high": 8.31,
            "low": 8.11,
            "close": 8.14,
            "adjclose": 8.14
        },
        "1601472600": {
            "date": "30-09-2020",
            "open": 8.11,
            "high": 8.46,
            "low": 8.08,
            "close": 8.38,
            "adjclose": 8.38
        },
        "1601559000": {
            "date": "01-10-2020",
            "open": 8.41,
            "high": 8.45,
            "low": 8.06,
            "close": 8.15,
            "adjclose": 8.15
        },
        "1601645400": {
            "date": "02-10-2020",
            "open": 8.09,
            "high": 8.22,
            "low": 7.9,
            "close": 8.18,
            "adjclose": 8.18
        },
        "1601904600": {
            "date": "05-10-2020",
            "open": 8.22,
            "high": 8.48,
            "low": 8.13,
            "close": 8.44,
            "adjclose": 8.44
        },
        "1601991000": {
            "date": "06-10-2020",
            "open": 8.48,
            "high": 8.55,
            "low": 8.3,
            "close": 8.34,
            "adjclose": 8.34
        },
        "1602077400": {
            "date": "07-10-2020",
            "open": 8.4,
            "high": 8.52,
            "low": 8.31,
            "close": 8.39,
            "adjclose": 8.39
        },
        "1602163800": {
            "date": "08-10-2020",
            "open": 8.41,
            "high": 8.73,
            "low": 8.39,
            "close": 8.71,
            "adjclose": 8.71
        },
        "1602250200": {
            "date": "09-10-2020",
            "open": 8.72,
            "high": 8.72,
            "low": 8.52,
            "close": 8.71,
            "adjclose": 8.71
        },
        "1602509400": {
            "date": "12-10-2020",
            "open": 8.58,
            "high": 8.61,
            "low": 8.36,
            "close": 8.38,
            "adjclose": 8.38
        },
        "1602595800": {
            "date": "13-10-2020",
            "open": 8.36,
            "high": 8.4,
            "low": 8.25,
            "close": 8.26,
            "adjclose": 8.26
        },
        "1602682200": {
            "date": "14-10-2020",
            "open": 8.27,
            "high": 8.5,
            "low": 8.22,
            "close": 8.47,
            "adjclose": 8.47
        },
        "1602768600": {
            "date": "15-10-2020",
            "open": 8.35,
            "high": 8.8,
            "low": 8.35,
            "close": 8.77,
            "adjclose": 8.77
        },
        "1602855000": {
            "date": "16-10-2020",
            "open": 8.73,
            "high": 8.88,
            "low": 8.63,
            "close": 8.69,
            "adjclose": 8.69
        },
        "1603114200": {
            "date": "19-10-2020",
            "open": 8.71,
            "high": 8.74,
            "low": 8.51,
            "close": 8.69,
            "adjclose": 8.69
        },
        "1603200600": {
            "date": "20-10-2020",
            "open": 8.57,
            "high": 8.97,
            "low": 8.56,
            "close": 8.82,
            "adjclose": 8.82
        },
        "1603287000": {
            "date": "21-10-2020",
            "open": 8.84,
            "high": 9.02,
            "low": 8.78,
            "close": 8.89,
            "adjclose": 8.89
        },
        "1603373400": {
            "date": "22-10-2020",
            "open": 8.9,
            "high": 8.93,
            "low": 8.74,
            "close": 8.84,
            "adjclose": 8.84
        },
        "1603459800": {
            "date": "23-10-2020",
            "open": 8.8,
            "high": 8.81,
            "low": 8.64,
            "close": 8.66,
            "adjclose": 8.66
        },
        "1603722600": {
            "date": "26-10-2020",
            "open": 8.67,
            "high": 8.69,
            "low": 8.45,
            "close": 8.48,
            "adjclose": 8.48
        },
        "1603809000": {
            "date": "27-10-2020",
            "open": 8.49,
            "high": 8.51,
            "low": 8.2,
            "close": 8.27,
            "adjclose": 8.27
        },
        "1603895400": {
            "date": "28-10-2020",
            "open": 8.26,
            "high": 8.48,
            "low": 8.04,
            "close": 8.37,
            "adjclose": 8.37
        },
        "1603981800": {
            "date": "29-10-2020",
            "open": 8.35,
            "high": 8.54,
            "low": 8.21,
            "close": 8.44,
            "adjclose": 8.44
        },
        "1604068200": {
            "date": "30-10-2020",
            "open": 8.35,
            "high": 8.84,
            "low": 8.35,
            "close": 8.76,
            "adjclose": 8.76
        },
        "1604413800": {
            "date": "03-11-2020",
            "open": 8.77,
            "high": 9.08,
            "low": 8.77,
            "close": 9,
            "adjclose": 9
        },
        "1604500200": {
            "date": "04-11-2020",
            "open": 9,
            "high": 9,
            "low": 8.41,
            "close": 8.44,
            "adjclose": 8.44
        },
        "1604586600": {
            "date": "05-11-2020",
            "open": 8.51,
            "high": 8.62,
            "low": 8.43,
            "close": 8.59,
            "adjclose": 8.59
        },
        "1604673000": {
            "date": "06-11-2020",
            "open": 8.6,
            "high": 8.68,
            "low": 8.19,
            "close": 8.34,
            "adjclose": 8.34
        },
        "1604932200": {
            "date": "09-11-2020",
            "open": 8.5,
            "high": 8.75,
            "low": 8.49,
            "close": 8.71,
            "adjclose": 8.71
        },
        "1605018600": {
            "date": "10-11-2020",
            "open": 8.72,
            "high": 9.3,
            "low": 8.72,
            "close": 9.21,
            "adjclose": 9.21
        },
        "1605105000": {
            "date": "11-11-2020",
            "open": 9.25,
            "high": 9.4,
            "low": 9.09,
            "close": 9.2,
            "adjclose": 9.2
        },
        "1605191400": {
            "date": "12-11-2020",
            "open": 9.16,
            "high": 9.4,
            "low": 8.98,
            "close": 9.04,
            "adjclose": 9.04
        },
        "1605277800": {
            "date": "13-11-2020",
            "open": 9.11,
            "high": 9.15,
            "low": 8.94,
            "close": 9.07,
            "adjclose": 9.07
        },
        "1605623400": {
            "date": "17-11-2020",
            "open": 9.1,
            "high": 9.39,
            "low": 9.07,
            "close": 9.32,
            "adjclose": 9.32
        },
        "1605709800": {
            "date": "18-11-2020",
            "open": 9.41,
            "high": 9.83,
            "low": 9.36,
            "close": 9.74,
            "adjclose": 9.74
        },
        "1605796200": {
            "date": "19-11-2020",
            "open": 9.76,
            "high": 9.77,
            "low": 9.4,
            "close": 9.45,
            "adjclose": 9.45
        },
        "1605882600": {
            "date": "20-11-2020",
            "open": 9.46,
            "high": 9.46,
            "low": 9.16,
            "close": 9.23,
            "adjclose": 9.23
        },
        "1606141800": {
            "date": "23-11-2020",
            "open": 9.29,
            "high": 9.38,
            "low": 9.23,
            "close": 9.28,
            "adjclose": 9.28
        },
        "1606228200": {
            "date": "24-11-2020",
            "open": 9.33,
            "high": 9.82,
            "low": 9.32,
            "close": 9.79,
            "adjclose": 9.79
        },
        "1606314600": {
            "date": "25-11-2020",
            "open": 9.71,
            "high": 9.71,
            "low": 9.38,
            "close": 9.42,
            "adjclose": 9.42
        },
        "1606401000": {
            "date": "26-11-2020",
            "open": 9.49,
            "high": 9.49,
            "low": 9.25,
            "close": 9.29,
            "adjclose": 9.29
        },
        "1606487400": {
            "date": "27-11-2020",
            "open": 9.35,
            "high": 9.49,
            "low": 9.25,
            "close": 9.31,
            "adjclose": 9.31
        },
        "1606746600": {
            "date": "30-11-2020",
            "open": 9.31,
            "high": 9.47,
            "low": 9.12,
            "close": 9.2,
            "adjclose": 9.2
        },
        "1606833000": {
            "date": "01-12-2020",
            "open": 9.33,
            "high": 10.49,
            "low": 9.33,
            "close": 10.02,
            "adjclose": 10.02
        },
        "1606919400": {
            "date": "02-12-2020",
            "open": 10,
            "high": 10,
            "low": 9.75,
            "close": 9.97,
            "adjclose": 9.97
        },
        "1607005800": {
            "date": "03-12-2020",
            "open": 9.93,
            "high": 10.64,
            "low": 9.9,
            "close": 10.58,
            "adjclose": 10.58
        },
        "1607092200": {
            "date": "04-12-2020",
            "open": 10.65,
            "high": 11.26,
            "low": 10.65,
            "close": 10.99,
            "adjclose": 10.99
        },
        "1607351400": {
            "date": "07-12-2020",
            "open": 10.99,
            "high": 11.18,
            "low": 10.8,
            "close": 11.16,
            "adjclose": 11.16
        },
        "1607437800": {
            "date": "08-12-2020",
            "open": 11.15,
            "high": 11.15,
            "low": 10.83,
            "close": 10.96,
            "adjclose": 10.96
        },
        "1607524200": {
            "date": "09-12-2020",
            "open": 10.96,
            "high": 11,
            "low": 10.49,
            "close": 10.59,
            "adjclose": 10.59
        },
        "1607610600": {
            "date": "10-12-2020",
            "open": 10.58,
            "high": 11.03,
            "low": 10.41,
            "close": 10.99,
            "adjclose": 10.99
        },
        "1607697000": {
            "date": "11-12-2020",
            "open": 11.01,
            "high": 11.01,
            "low": 10.45,
            "close": 10.76,
            "adjclose": 10.76
        },
        "1607956200": {
            "date": "14-12-2020",
            "open": 10.82,
            "high": 10.83,
            "low": 10.55,
            "close": 10.58,
            "adjclose": 10.58
        },
        "1608042600": {
            "date": "15-12-2020",
            "open": 10.56,
            "high": 10.7,
            "low": 10.51,
            "close": 10.52,
            "adjclose": 10.52
        },
        "1608129000": {
            "date": "16-12-2020",
            "open": 10.58,
            "high": 10.63,
            "low": 10.49,
            "close": 10.52,
            "adjclose": 10.52
        },
        "1608215400": {
            "date": "17-12-2020",
            "open": 10.55,
            "high": 10.78,
            "low": 10.52,
            "close": 10.72,
            "adjclose": 10.72
        },
        "1608301800": {
            "date": "18-12-2020",
            "open": 10.75,
            "high": 10.78,
            "low": 10.2,
            "close": 10.3,
            "adjclose": 10.3
        },
        "1608561000": {
            "date": "21-12-2020",
            "open": 10.21,
            "high": 10.36,
            "low": 10.15,
            "close": 10.23,
            "adjclose": 10.23
        },
        "1608647400": {
            "date": "22-12-2020",
            "open": 10.28,
            "high": 10.35,
            "low": 10.02,
            "close": 10.15,
            "adjclose": 10.15
        },
        "1608733800": {
            "date": "23-12-2020",
            "open": 10.2,
            "high": 10.44,
            "low": 10.15,
            "close": 10.37,
            "adjclose": 10.37
        },
        "1608820200": {
            "date": "24-12-2020",
            "open": 10.36,
            "high": 10.36,
            "low": 10.12,
            "close": 10.25,
            "adjclose": 10.25
        },
        "1609165800": {
            "date": "28-12-2020",
            "open": 10.31,
            "high": 10.42,
            "low": 10.2,
            "close": 10.32,
            "adjclose": 10.32
        },
        "1609252200": {
            "date": "29-12-2020",
            "open": 10.35,
            "high": 10.45,
            "low": 10.21,
            "close": 10.26,
            "adjclose": 10.26
        },
        "1609338600": {
            "date": "30-12-2020",
            "open": 10.32,
            "high": 10.48,
            "low": 10.29,
            "close": 10.37,
            "adjclose": 10.37
        },
        "1609425000": {
            "date": "31-12-2020",
            "open": 10.39,
            "high": 10.39,
            "low": 10.24,
            "close": 10.27,
            "adjclose": 10.27
        },
        "1609770600": {
            "date": "04-01-2021",
            "open": 10.32,
            "high": 10.52,
            "low": 10.27,
            "close": 10.39,
            "adjclose": 10.39
        },
        "1609857000": {
            "date": "05-01-2021",
            "open": 10.38,
            "high": 10.68,
            "low": 10.3,
            "close": 10.66,
            "adjclose": 10.66
        },
        "1609943400": {
            "date": "06-01-2021",
            "open": 10.71,
            "high": 11.76,
            "low": 10.71,
            "close": 11.55,
            "adjclose": 11.55
        },
        "1610029800": {
            "date": "07-01-2021",
            "open": 11.61,
            "high": 11.71,
            "low": 11.51,
            "close": 11.65,
            "adjclose": 11.65
        },
        "1610116200": {
            "date": "08-01-2021",
            "open": 11.72,
            "high": 11.73,
            "low": 11.52,
            "close": 11.57,
            "adjclose": 11.57
        },
        "1610375400": {
            "date": "11-01-2021",
            "open": 11.54,
            "high": 11.55,
            "low": 11.28,
            "close": 11.36,
            "adjclose": 11.36
        },
        "1610461800": {
            "date": "12-01-2021",
            "open": 11.42,
            "high": 11.79,
            "low": 11.33,
            "close": 11.54,
            "adjclose": 11.54
        },
        "1610548200": {
            "date": "13-01-2021",
            "open": 11.6,
            "high": 11.64,
            "low": 11.38,
            "close": 11.41,
            "adjclose": 11.41
        },
        "1610634600": {
            "date": "14-01-2021",
            "open": 11.47,
            "high": 12.25,
            "low": 11.46,
            "close": 12.17,
            "adjclose": 12.17
        },
        "1610721000": {
            "date": "15-01-2021",
            "open": 12.13,
            "high": 12.72,
            "low": 12.08,
            "close": 12.66,
            "adjclose": 12.66
        },
        "1610980200": {
            "date": "18-01-2021",
            "open": 12.66,
            "high": 12.75,
            "low": 12.44,
            "close": 12.67,
            "adjclose": 12.67
        },
        "1611066600": {
            "date": "19-01-2021",
            "open": 12.7,
            "high": 13.19,
            "low": 12.59,
            "close": 13.07,
            "adjclose": 13.07
        },
        "1611153000": {
            "date": "20-01-2021",
            "open": 13.1,
            "high": 13.1,
            "low": 12.91,
            "close": 13.04,
            "adjclose": 13.04
        },
        "1611239400": {
            "date": "21-01-2021",
            "open": 13.1,
            "high": 13.1,
            "low": 12.62,
            "close": 12.71,
            "adjclose": 12.71
        },
        "1611325800": {
            "date": "22-01-2021",
            "open": 12.63,
            "high": 12.73,
            "low": 12.21,
            "close": 12.34,
            "adjclose": 12.34
        },
        "1611585000": {
            "date": "25-01-2021",
            "open": 12.44,
            "high": 12.47,
            "low": 12.02,
            "close": 12.43,
            "adjclose": 12.43
        },
        "1611671400": {
            "date": "26-01-2021",
            "open": 12.4,
            "high": 12.46,
            "low": 12.25,
            "close": 12.38,
            "adjclose": 12.38
        },
        "1611757800": {
            "date": "27-01-2021",
            "open": 12.27,
            "high": 12.31,
            "low": 11.79,
            "close": 11.84,
            "adjclose": 11.84
        },
        "1611844200": {
            "date": "28-01-2021",
            "open": 11.94,
            "high": 12.27,
            "low": 11.74,
            "close": 12.17,
            "adjclose": 12.17
        },
        "1611930600": {
            "date": "29-01-2021",
            "open": 12.17,
            "high": 12.17,
            "low": 11.71,
            "close": 11.76,
            "adjclose": 11.76
        },
        "1612276200": {
            "date": "02-02-2021",
            "open": 11.8,
            "high": 12.73,
            "low": 11.8,
            "close": 12.52,
            "adjclose": 12.52
        },
        "1612362600": {
            "date": "03-02-2021",
            "open": 12.63,
            "high": 12.95,
            "low": 12.46,
            "close": 12.89,
            "adjclose": 12.89
        },
        "1612464512": {
            "date": "04-02-2021",
            "open": 12.95,
            "high": 13.08,
            "low": 12.81,
            "close": 13.01,
            "adjclose": 13.01
        }
    },
    "error": null
}`
      try{
        let dummyJson = JSON.parse(dummyResponse);
        this.serverResponse = {...dummyJson, requestDate : new Date()}; 
      }catch(ex){
        console.log(ex)
      }
      
    }
}
</script>

